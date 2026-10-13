import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  async findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const data = await this.service.findAll(tenantId);
    return { success: true, message: 'Users fetched successfully', data };
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const data = await this.service.create(tenantId, body);
    return { success: true, message: 'User created successfully', data };
  }
}
