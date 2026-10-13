import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller.js';
import { ComplianceService } from './compliance.service.js';
import { AuthModule } from '../../../core/auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}