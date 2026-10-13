import { Controller, Get, Post, Put, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service.js';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard.js';

@Controller('docsafe/compliance-items')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: any) {
    const data = await this.service.findAll(req.user.tenantId, query);
    return { success: true, message: 'Compliance items fetched successfully', data };
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const data = await this.service.findOne(req.user.tenantId, id);
    return { success: true, message: 'Compliance item fetched successfully', data };
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const data = await this.service.create(req.user.tenantId, body);
    return { success: true, message: 'Compliance item created successfully', data };
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.service.update(req.user.tenantId, id, body);
    return { success: true, message: 'Compliance item updated successfully', data };
  }
}
