import { Controller, Post, Request } from '@nestjs/common';
import { StorageService } from './storage.service.js';

@Controller('storage')
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @Post('upload')
  async upload(@Request() req: any) {
    // In a real Fastify app, req.isMultipart() & req.file() would be used.
    // This is a placeholder for the business logic layer.
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const userId = req.user?.id || 'dummy-user-id';
    
    const dummyFile = { filename: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('dummy') };
    const data = await this.service.uploadFile(tenantId, userId, dummyFile);
    return { success: true, message: 'File uploaded successfully', data };
  }
}
