import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { AuditModule } from '../../../core/audit/audit.module.js';
import { AuthModule } from '../../../core/auth/auth.module.js';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}