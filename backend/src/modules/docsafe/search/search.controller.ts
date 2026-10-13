import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service.js';
import { ComplianceService } from '../compliance/compliance.service.js';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard.js';

@Controller('docsafe/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly complianceService: ComplianceService,
  ) {}

  @Get('documents')
  async searchDocuments(@Request() req: any, @Query() query: any) {
    const data = await this.documentsService.findAll(req.user.tenantId, query);
    return { success: true, message: 'Documents search results', data };
  }

  @Get('compliance-items')
  async searchComplianceItems(@Request() req: any, @Query() query: any) {
    const data = await this.complianceService.findAll(req.user.tenantId, query);
    return { success: true, message: 'Compliance search results', data };
  }
}
