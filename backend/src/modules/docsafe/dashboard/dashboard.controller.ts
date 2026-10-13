import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard.js';

@Controller('docsafe/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  async getSummary(@Request() req: any) {
    const data = await this.service.getSummary(req.user.tenantId);
    return { success: true, message: 'Dashboard summary fetched successfully', data };
  }

  @Get('expiring-soon')
  async getExpiringSoon(@Request() req: any, @Query('days') days?: string) {
    const data = await this.service.getExpiringSoon(req.user.tenantId, days ? parseInt(days, 10) : 30);
    return { success: true, message: 'Expiring soon documents fetched successfully', data };
  }

  @Get('expired')
  async getExpired(@Request() req: any) {
    const data = await this.service.getExpired(req.user.tenantId);
    return { success: true, message: 'Expired documents fetched successfully', data };
  }

  @Get('missing')
  async getMissing(@Request() req: any) {
    const data = await this.service.getMissing(req.user.tenantId);
    return { success: true, message: 'Missing compliance items fetched successfully', data };
  }
}
