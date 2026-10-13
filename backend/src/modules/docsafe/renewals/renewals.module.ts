import { Module } from '@nestjs/common';
import { RenewalsController } from './renewals.controller.js';
import { RenewalsService } from './renewals.service.js';
import { AuditModule } from '../../../core/audit/audit.module.js';
import { AuthModule } from '../../../core/auth/auth.module.js';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [RenewalsController],
  providers: [RenewalsService],
  exports: [RenewalsService],
})
export class RenewalsModule {}