import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { RenewalsService } from './renewals.service.js';

@Controller('renewals')
export class RenewalsController {
  constructor(private readonly service: RenewalsService) {}

  @Get()
  async findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const data = await this.service.findAll(tenantId);
    return { success: true, message: 'Renewals fetched', data };
  }

  @Post('initiate')
  async initiate(@Request() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const userId = req.user?.id || 'dummy-user-id';
    const data = await this.service.initiateRenewal(tenantId, userId, body.documentId);
    return { success: true, message: 'Renewal initiated', data };
  }
}
