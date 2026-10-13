import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { AuditService } from '../../../core/audit/audit.service.js';

@Injectable()
export class RenewalsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll(tenantId: string) {
    return this.prisma.renewalRecord.findMany({ where: { tenantId } });
  }

  async initiateRenewal(tenantId: string, userId: string, documentId: string) {
    const renewal = await this.prisma.renewalRecord.create({
      data: {
        tenantId,
        documentId,
        initiatedBy: userId,
        stage: 'REVIEW',
        status: 'INITIATED'
      }
    });
    
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'RENEWAL_IN_PROGRESS' }
    });
    
    await this.audit.logEvent(tenantId, documentId, 'RENEWAL_INITIATED', userId, { renewalId: renewal.id });
    return renewal;
  }
}
