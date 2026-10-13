import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { TenantsService } from './tenants.service.js';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get()
  async findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const data = await this.service.findAll(tenantId);
    return { success: true, message: 'Tenants fetched successfully', data };
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const data = await this.service.create(tenantId, body);
    return { success: true, message: 'Tenants created successfully', data };
  }
}