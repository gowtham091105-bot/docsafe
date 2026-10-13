import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { AuditService } from '../../../core/audit/audit.service.js';
import { DocumentStatus, RenewalStatus } from '../../../shared/enums/index.js';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private calculateStatus(expiryDate: Date, currentStatus?: DocumentStatus): DocumentStatus {
    if (currentStatus === DocumentStatus.ARCHIVED) return DocumentStatus.ARCHIVED;
    if (currentStatus === DocumentStatus.RENEWAL_IN_PROGRESS) return DocumentStatus.RENEWAL_IN_PROGRESS;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);

    if (exp < now) {
      return DocumentStatus.EXPIRED;
    }

    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (exp <= thirtyDaysFromNow) {
      return DocumentStatus.EXPIRING_SOON;
    }

    return DocumentStatus.ACTIVE;
  }

  async findAll(tenantId: string, query: {
    search?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (query.search && query.search.trim()) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [total, data] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          fileAsset: { select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true } },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        uploader: { select: { id: true, firstName: true, lastName: true, email: true } },
        fileAsset: true,
        complianceItems: true,
        renewals: { orderBy: { initiatedAt: 'desc' } },
        events: { orderBy: { triggeredAt: 'desc' } },
      },
    });

    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(tenantId: string, userId: string, data: any) {
    // 1. Validation
    if (!data.title || !data.categoryId || !data.issueDate || !data.expiryDate) {
      throw new BadRequestException('Title, Category, Issue Date, and Expiry Date are required');
    }

    const category = await this.prisma.category.findFirst({
      where: { id: data.categoryId, tenantId },
    });
    if (!category) throw new BadRequestException('Invalid category selected');

    if (data.ownerUserId) {
      const owner = await this.prisma.user.findFirst({
        where: { id: data.ownerUserId, tenantId },
      });
      if (!owner) throw new BadRequestException('Invalid owner selected');
    }

    const issueDate = new Date(data.issueDate);
    const expiryDate = new Date(data.expiryDate);

    if (expiryDate < issueDate) {
      throw new BadRequestException('Expiry date must be greater than or equal to issue date');
    }

    let renewalDueDate: Date | undefined;
    if (data.renewalDueDate) {
      renewalDueDate = new Date(data.renewalDueDate);
      if (renewalDueDate > expiryDate) {
        throw new BadRequestException('Renewal due date should not be later than expiry date');
      }
    }

    const status = this.calculateStatus(expiryDate);

    const doc = await this.prisma.document.create({
      data: {
        tenantId,
        categoryId: data.categoryId,
        title: data.title.trim(),
        description: data.description,
        issueDate,
        expiryDate,
        renewalDueDate,
        status,
        visibilityScope: data.visibilityScope || 'ORGANIZATION',
        uploadedBy: userId,
        ownerUserId: data.ownerUserId || userId,
      },
      include: { category: true, owner: true },
    });

    await this.audit.logEvent(tenantId, doc.id, 'DOCUMENT_CREATED', userId, {
      title: doc.title,
      categoryId: doc.categoryId,
    });

    return doc;
  }

  async update(tenantId: string, id: string, userId: string, data: any) {
    const existing = await this.findOne(tenantId, id);

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: data.categoryId, tenantId },
      });
      if (!category) throw new BadRequestException('Invalid category');
    }

    if (data.ownerUserId && data.ownerUserId !== existing.ownerUserId) {
      const owner = await this.prisma.user.findFirst({
        where: { id: data.ownerUserId, tenantId },
      });
      if (!owner) throw new BadRequestException('Invalid owner');
    }

    const issueDate = data.issueDate ? new Date(data.issueDate) : existing.issueDate;
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : existing.expiryDate;

    if (expiryDate < issueDate) {
      throw new BadRequestException('Expiry date must be greater than or equal to issue date');
    }

    let renewalDueDate: Date | null = existing.renewalDueDate;
    if (data.renewalDueDate) {
      renewalDueDate = new Date(data.renewalDueDate);
      if (renewalDueDate > expiryDate) {
        throw new BadRequestException('Renewal due date should not be later than expiry date');
      }
    }

    const calculatedStatus = this.calculateStatus(expiryDate, (data.status || existing.status) as DocumentStatus);

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        title: data.title ? data.title.trim() : undefined,
        description: data.description !== undefined ? data.description : undefined,
        categoryId: data.categoryId || undefined,
        ownerUserId: data.ownerUserId || undefined,
        issueDate,
        expiryDate,
        renewalDueDate,
        status: calculatedStatus,
      },
      include: { category: true, owner: true, fileAsset: true },
    });

    await this.audit.logEvent(tenantId, id, 'DOCUMENT_METADATA_UPDATED', userId, {
      title: updated.title,
    });

    return updated;
  }

  async attachFile(tenantId: string, id: string, userId: string, fileAssetId: string) {
    await this.findOne(tenantId, id);

    const updated = await this.prisma.document.update({
      where: { id },
      data: { fileAssetId },
      include: { fileAsset: true, category: true },
    });

    await this.audit.logEvent(tenantId, id, 'FILE_UPLOADED', userId, {
      fileAssetId,
    });

    return updated;
  }

  async initiateRenewal(tenantId: string, id: string, userId: string, remarks?: string) {
    const doc = await this.findOne(tenantId, id);

    const renewal = await this.prisma.renewalRecord.create({
      data: {
        tenantId,
        documentId: id,
        initiatedBy: userId,
        stage: 'Initiated',
        remarks: remarks || 'Renewal initiated',
        status: RenewalStatus.INITIATED,
      },
    });

    await this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.RENEWAL_IN_PROGRESS },
    });

    await this.audit.logEvent(tenantId, id, 'RENEWAL_INITIATED', userId, {
      renewalId: renewal.id,
      remarks,
    });

    return renewal;
  }

  async getHistory(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.audit.getEvents(tenantId, id);
  }
}
