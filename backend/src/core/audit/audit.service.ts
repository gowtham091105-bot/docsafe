import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logEvent(tenantId: string, documentId: string, eventType: string, triggeredBy: string, payload: any = {}) {
    return this.prisma.documentEvent.create({
      data: {
        tenantId,
        documentId,
        eventType,
        triggeredBy,
        payloadJson: JSON.stringify(payload)
      }
    });
  }

  async getEvents(tenantId: string, documentId: string) {
    return this.prisma.documentEvent.findMany({
      where: { tenantId, documentId },
      orderBy: { triggeredAt: 'desc' }
    });
  }

  async getRecentEvents(tenantId: string, limit: number = 10) {
    return this.prisma.documentEvent.findMany({
      where: { tenantId },
      orderBy: { triggeredAt: 'desc' },
      take: limit,
      include: {
        document: {
          select: { id: true, title: true }
        }
      }
    });
  }
}
