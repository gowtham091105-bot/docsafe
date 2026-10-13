import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';
import { AuthModule } from './core/auth/auth.module.js';
import { UsersModule } from './core/users/users.module.js';
import { TenantsModule } from './core/tenants/tenants.module.js';
import { AuditModule } from './core/audit/audit.module.js';
import { StorageModule } from './core/storage/storage.module.js';
import { CategoriesModule } from './modules/docsafe/categories/categories.module.js';
import { DocumentsModule } from './modules/docsafe/documents/documents.module.js';
import { ComplianceModule } from './modules/docsafe/compliance/compliance.module.js';
import { RenewalsModule } from './modules/docsafe/renewals/renewals.module.js';
import { DashboardModule } from './modules/docsafe/dashboard/dashboard.module.js';
import { SearchModule } from './modules/docsafe/search/search.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    AuditModule,
    StorageModule,
    CategoriesModule,
    DocumentsModule,
    ComplianceModule,
    RenewalsModule,
    DashboardModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}