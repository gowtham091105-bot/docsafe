import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(tenantId: string, userId: string, data: { name: string; description?: string; isActive?: boolean }) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Category name is required');
    }
    const existing = await this.prisma.category.findFirst({
      where: { tenantId, name: { equals: data.name.trim(), mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(`Category "${data.name}" already exists for this tenant`);
    }

    return this.prisma.category.create({
      data: {
        name: data.name.trim(),
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : true,
        tenantId,
        createdBy: userId,
      },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const category = await this.findOne(tenantId, id);
    if (data.name && data.name.trim() !== category.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          tenantId,
          name: { equals: data.name.trim(), mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(`Category "${data.name}" already exists for this tenant`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    // Soft deactivation or deletion if no linked documents
    const docCount = await this.prisma.document.count({ where: { categoryId: id, tenantId } });
    if (docCount > 0) {
      // Soft-deactivate to prevent breaking foreign keys
      return this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.category.delete({ where: { id } });
  }
}