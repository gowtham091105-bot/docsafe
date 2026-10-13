import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { StorageModule } from '../../../core/storage/storage.module.js';
import { AuditModule } from '../../../core/audit/audit.module.js';
import { AuthModule } from '../../../core/auth/auth.module.js';

@Module({
  imports: [StorageModule, AuditModule, AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}