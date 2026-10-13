import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { ComplianceSeverity, ComplianceStatus } from '../../../shared/enums/index.js';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: {
    search?: string;
    status?: string;
    severity?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (query.search && query.search.trim()) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    const [total, data] = await Promise.all([
      this.prisma.complianceItem.count({ where }),
      this.prisma.complianceItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          document: { select: { id: true, title: true, status: true, expiryDate: true } },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.complianceItem.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        document: true,
      },
    });
    if (!item) throw new NotFoundException('Compliance item not found');
    return item;
  }

  async create(tenantId: string, data: any) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Compliance item name is required');
    }

    if (data.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: data.categoryId, tenantId },
      });
      if (!category) throw new BadRequestException('Invalid category selected');
    }

    if (data.linkedDocumentId) {
      const doc = await this.prisma.document.findFirst({
        where: { id: data.linkedDocumentId, tenantId },
      });
      if (!doc) throw new BadRequestException('Linked document does not exist in this organization');
    }

    return this.prisma.complianceItem.create({
      data: {
        tenantId,
        name: data.name.trim(),
        categoryId: data.categoryId || null,
        linkedDocumentId: data.linkedDocumentId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        severity: (data.severity as ComplianceSeverity) || ComplianceSeverity.MEDIUM,
        status: (data.status as ComplianceStatus) || ComplianceStatus.PENDING,
        notes: data.notes || null,
      },
      include: { category: true, document: true },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);

    if (data.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: data.categoryId, tenantId },
      });
      if (!category) throw new BadRequestException('Invalid category');
    }

    if (data.linkedDocumentId) {
      const doc = await this.prisma.document.findFirst({
        where: { id: data.linkedDocumentId, tenantId },
      });
      if (!doc) throw new BadRequestException('Linked document does not belong to this organization');
    }

    return this.prisma.complianceItem.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : undefined,
        categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
        linkedDocumentId: data.linkedDocumentId !== undefined ? data.linkedDocumentId : undefined,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        severity: data.severity ? (data.severity as ComplianceSeverity) : undefined,
        status: data.status ? (data.status as ComplianceStatus) : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
      include: { category: true, document: true },
    });
  }
}
