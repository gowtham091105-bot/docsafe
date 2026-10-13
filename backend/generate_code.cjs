const fs = require('fs');
const path = require('path');

const coreModules = ['auth', 'users', 'tenants', 'audit', 'storage'];
const docsafeModules = ['categories', 'documents', 'compliance', 'renewals', 'dashboard'];

function createModule(basePath, moduleName) {
  const dir = path.join(__dirname, 'src', basePath, moduleName);
  fs.mkdirSync(dir, { recursive: true });

  const capitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

  // Module file
  fs.writeFileSync(path.join(dir, `${moduleName}.module.ts`), `
import { Module } from '@nestjs/common';
import { ${capitalized}Controller } from './${moduleName}.controller';
import { ${capitalized}Service } from './${moduleName}.service';

@Module({
  controllers: [${capitalized}Controller],
  providers: [${capitalized}Service],
  exports: [${capitalized}Service],
})
export class ${capitalized}Module {}
  `.trim());

  // Controller file
  fs.writeFileSync(path.join(dir, `${moduleName}.controller.ts`), `
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { ${capitalized}Service } from './${moduleName}.service';

@Controller('${moduleName}')
export class ${capitalized}Controller {
  constructor(private readonly service: ${capitalized}Service) {}

  @Get()
  async findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const data = await this.service.findAll(tenantId);
    return { success: true, message: '${capitalized} fetched successfully', data };
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const data = await this.service.create(tenantId, body);
    return { success: true, message: '${capitalized} created successfully', data };
  }
}
  `.trim());

  // Service file
  fs.writeFileSync(path.join(dir, `${moduleName}.service.ts`), `
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${capitalized}Service {
  async findAll(tenantId: string) {
    return [];
  }

  async create(tenantId: string, data: any) {
    return { id: 'new-id', ...data, tenantId };
  }
}
  `.trim());
}

coreModules.forEach(m => createModule('core', m));
docsafeModules.forEach(m => createModule('modules/docsafe', m));

// Create Prisma Service
const prismaDir = path.join(__dirname, 'src', 'shared', 'prisma');
fs.mkdirSync(prismaDir, { recursive: true });
fs.writeFileSync(path.join(prismaDir, 'prisma.service.ts'), `
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
`.trim());
fs.writeFileSync(path.join(prismaDir, 'prisma.module.ts'), `
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`.trim());

// Update App Module
const appModulePath = path.join(__dirname, 'src', 'app.module.ts');
fs.writeFileSync(appModulePath, `
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
${coreModules.map(m => `import { ${m.charAt(0).toUpperCase() + m.slice(1)}Module } from './core/${m}/${m}.module';`).join('\n')}
${docsafeModules.map(m => `import { ${m.charAt(0).toUpperCase() + m.slice(1)}Module } from './modules/docsafe/${m}/${m}.module';`).join('\n')}

@Module({
  imports: [
    PrismaModule,
    ${coreModules.map(m => `${m.charAt(0).toUpperCase() + m.slice(1)}Module`).join(',\n    ')},
    ${docsafeModules.map(m => `${m.charAt(0).toUpperCase() + m.slice(1)}Module`).join(',\n    ')}
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`.trim());

// Seed script
const seedPath = path.join(__dirname, 'prisma', 'seed.ts');
fs.writeFileSync(seedPath, `
import { PrismaClient, Role, DocumentStatus, ComplianceSeverity, ComplianceStatus, RenewalStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Test Tenant',
    },
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@test.com',
      passwordHash: 'hashed_password',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('Seed completed!', { tenantId: tenant.id, userId: user.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`.trim());

console.log('Generation completed.');
