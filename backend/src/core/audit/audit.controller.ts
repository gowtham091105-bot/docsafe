import { Controller, Get, Param, Request } from '@nestjs/common';
import { AuditService } from './audit.service.js';

@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get(':documentId')
  async getEvents(@Request() req: any, @Param('documentId') documentId: string) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const data = await this.service.getEvents(tenantId, documentId);
    return { success: true, message: 'Audit events fetched successfully', data };
  }
}
