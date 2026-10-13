import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { AuditService } from '../../../core/audit/audit.service.js';
import { DocumentStatus, ComplianceStatus, RenewalStatus } from '../../../shared/enums/index.js';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getSummary(tenantId: string) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalDocuments,
      activeDocuments,
      expiringSoon,
      expired,
      missingCompliance,
      renewalsInProgress,
      recentActivity,
      expiringSoonList,
      missingComplianceList,
    ] = await Promise.all([
      this.prisma.document.count({ where: { tenantId } }),
      this.prisma.document.count({ where: { tenantId, status: DocumentStatus.ACTIVE } }),
      this.prisma.document.count({
        where: {
          tenantId,
          status: { not: DocumentStatus.ARCHIVED },
          expiryDate: { gte: now, lte: thirtyDaysAhead },
        },
      }),
      this.prisma.document.count({
        where: {
          tenantId,
          status: { not: DocumentStatus.ARCHIVED },
          OR: [
            { status: DocumentStatus.EXPIRED },
            { expiryDate: { lt: now } },
          ],
        },
      }),
      this.prisma.complianceItem.count({
        where: { tenantId, status: ComplianceStatus.MISSING },
      }),
      this.prisma.renewalRecord.count({
        where: {
          tenantId,
          status: { in: [RenewalStatus.INITIATED, RenewalStatus.IN_PROGRESS] },
        },
      }),
      this.audit.getRecentEvents(tenantId, 10),
      this.prisma.document.findMany({
        where: {
          tenantId,
          status: { not: DocumentStatus.ARCHIVED },
          expiryDate: { gte: now, lte: thirtyDaysAhead },
        },
        take: 5,
        orderBy: { expiryDate: 'asc' },
        include: { category: true, owner: true },
      }),
      this.prisma.complianceItem.findMany({
        where: { tenantId, status: ComplianceStatus.MISSING },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { document: true },
      }),
    ]);

    return {
      totalDocuments,
      activeDocuments,
      expiringSoon,
      expired,
      missingCompliance,
      renewalsInProgress,
      recentActivity,
      quickLists: {
        expiringSoon: expiringSoonList,
        missingCompliance: missingComplianceList,
      },
    };
  }

  async getExpiringSoon(tenantId: string, days: number = 30) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const windowEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.document.findMany({
      where: {
        tenantId,
        status: { not: DocumentStatus.ARCHIVED },
        expiryDate: { gte: now, lte: windowEnd },
      },
      orderBy: { expiryDate: 'asc' },
      include: { category: true, owner: true },
    });
  }

  async getExpired(tenantId: string) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return this.prisma.document.findMany({
      where: {
        tenantId,
        status: { not: DocumentStatus.ARCHIVED },
        OR: [
          { status: DocumentStatus.EXPIRED },
          { expiryDate: { lt: now } },
        ],
      },
      orderBy: { expiryDate: 'desc' },
      include: { category: true, owner: true },
    });
  }

  async getMissing(tenantId: string) {
    return this.prisma.complianceItem.findMany({
      where: { tenantId, status: ComplianceStatus.MISSING },
      orderBy: { createdAt: 'desc' },
      include: { category: true, document: true },
    });
  }
}
