import { Module } from '@nestjs/common';
import { SearchController } from './search.controller.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { ComplianceModule } from '../compliance/compliance.module.js';
import { AuthModule } from '../../../core/auth/auth.module.js';

@Module({
  imports: [DocumentsModule, ComplianceModule, AuthModule],
  controllers: [SearchController],
})
export class SearchModule {}
