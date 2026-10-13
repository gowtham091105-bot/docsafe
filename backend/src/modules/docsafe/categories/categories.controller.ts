import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard.js';

@Controller('docsafe/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  async findAll(@Request() req: any) {
    const data = await this.service.findAll(req.user.tenantId);
    return { success: true, message: 'Categories fetched successfully', data };
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const data = await this.service.findOne(req.user.tenantId, id);
    return { success: true, message: 'Category fetched successfully', data };
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const data = await this.service.create(req.user.tenantId, req.user.id, body);
    return { success: true, message: 'Category created successfully', data };
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.service.update(req.user.tenantId, id, body);
    return { success: true, message: 'Category updated successfully', data };
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const data = await this.service.remove(req.user.tenantId, id);
    return { success: true, message: 'Category removed successfully', data };
  }
}