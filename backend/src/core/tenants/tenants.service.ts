import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantsService {
  async findAll(tenantId: string) {
    return [];
  }

  async create(tenantId: string, data: any) {
    return { id: 'new-id', ...data, tenantId };
  }
}