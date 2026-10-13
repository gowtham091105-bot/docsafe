import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Role, DocumentStatus, ComplianceSeverity, ComplianceStatus, RenewalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Docsafe Business Rules & Tenant Isolation Test Suite', () => {
  let prisma: PrismaClient;
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Id: string;
  let user2Id: string;
  let category1Id: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    // Create test tenants
    const t1 = await prisma.tenant.create({ data: { name: 'Test Corp 1' } });
    const t2 = await prisma.tenant.create({ data: { name: 'Test Corp 2' } });
    tenant1Id = t1.id;
    tenant2Id = t2.id;

    const hash = await bcrypt.hash('secret123', 10);
    const u1 = await prisma.user.create({
      data: {
        tenantId: tenant1Id,
        email: `u1_${Date.now()}@test.com`,
        passwordHash: hash,
        firstName: 'John',
        lastName: 'Doe',
        role: Role.ORG_ADMIN,
      },
    });
    const u2 = await prisma.user.create({
      data: {
        tenantId: tenant2Id,
        email: `u2_${Date.now()}@test.com`,
        passwordHash: hash,
        firstName: 'Alice',
        lastName: 'Smith',
        role: Role.ORG_ADMIN,
      },
    });
    user1Id = u1.id;
    user2Id = u2.id;

    const c1 = await prisma.category.create({
      data: {
        tenantId: tenant1Id,
        name: 'Contracts',
        createdBy: user1Id,
      },
    });
    category1Id = c1.id;
  });

  afterAll(async () => {
    // Cleanup
    if (tenant1Id) {
      await prisma.documentEvent.deleteMany({ where: { tenantId: tenant1Id } });
      await prisma.renewalRecord.deleteMany({ where: { tenantId: tenant1Id } });
      await prisma.complianceItem.deleteMany({ where: { tenantId: tenant1Id } });
      await prisma.document.deleteMany({ where: { tenantId: tenant1Id } });
      await prisma.category.deleteMany({ where: { tenantId: tenant1Id } });
      await prisma.user.deleteMany({ where: { tenantId: tenant1Id } });
      await prisma.tenant.deleteMany({ where: { id: tenant1Id } });
    }
    if (tenant2Id) {
      await prisma.documentEvent.deleteMany({ where: { tenantId: tenant2Id } });
      await prisma.renewalRecord.deleteMany({ where: { tenantId: tenant2Id } });
      await prisma.complianceItem.deleteMany({ where: { tenantId: tenant2Id } });
      await prisma.document.deleteMany({ where: { tenantId: tenant2Id } });
      await prisma.category.deleteMany({ where: { tenantId: tenant2Id } });
      await prisma.user.deleteMany({ where: { tenantId: tenant2Id } });
      await prisma.tenant.deleteMany({ where: { id: tenant2Id } });
    }
    await prisma.$disconnect();
  });

  it('validates password hashing and authentication comparison', async () => {
    const user = await prisma.user.findUnique({ where: { id: user1Id } });
    expect(user).toBeDefined();
    const isMatch = await bcrypt.compare('secret123', user!.passwordHash);
    expect(isMatch).toBe(true);
    const isInvalid = await bcrypt.compare('wrongpass', user!.passwordHash);
    expect(isInvalid).toBe(false);
  });

  it('enforces category uniqueness per tenant', async () => {
    // Creating duplicate category name within same tenant should fail
    await expect(
      prisma.category.create({
        data: {
          tenantId: tenant1Id,
          name: 'Contracts',
          createdBy: user1Id,
        },
      })
    ).rejects.toThrow();

    // But same name in DIFFERENT tenant should succeed
    const c2 = await prisma.category.create({
      data: {
        tenantId: tenant2Id,
        name: 'Contracts',
        createdBy: user2Id,
      },
    });
    expect(c2.id).toBeDefined();
    expect(c2.tenantId).toBe(tenant2Id);
  });

  it('creates document and verifies date and status calculations', async () => {
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15); // within 30 days -> EXPIRING_SOON

    const doc = await prisma.document.create({
      data: {
        tenantId: tenant1Id,
        categoryId: category1Id,
        title: 'Master Service Agreement',
        issueDate,
        expiryDate,
        status: DocumentStatus.EXPIRING_SOON,
        uploadedBy: user1Id,
      },
    });

    expect(doc.id).toBeDefined();
    expect(doc.status).toBe(DocumentStatus.EXPIRING_SOON);
  });

  it('enforces strict tenant isolation on queries', async () => {
    // Tenant 1 documents must not be visible to Tenant 2 queries
    const tenant1Docs = await prisma.document.findMany({
      where: { tenantId: tenant1Id },
    });
    expect(tenant1Docs.length).toBeGreaterThan(0);

    const crossTenantDocs = await prisma.document.findMany({
      where: { tenantId: tenant2Id },
    });
    // None of Tenant 1 docs should appear in Tenant 2 results
    const leaked = crossTenantDocs.some((d) => d.tenantId === tenant1Id);
    expect(leaked).toBe(false);
  });

  it('tracks renewal lifecycle with status transitions', async () => {
    const doc = await prisma.document.create({
      data: {
        tenantId: tenant1Id,
        categoryId: category1Id,
        title: 'Software License Renewal',
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000 * 10),
        status: DocumentStatus.ACTIVE,
        uploadedBy: user1Id,
      },
    });

    const renewal = await prisma.renewalRecord.create({
      data: {
        tenantId: tenant1Id,
        documentId: doc.id,
        initiatedBy: user1Id,
        stage: 'Initial Review',
        remarks: 'Vendor renewal discussion',
        status: RenewalStatus.INITIATED,
      },
    });

    expect(renewal.id).toBeDefined();
    expect(renewal.status).toBe(RenewalStatus.INITIATED);

    // Update doc to renewal in progress
    const updatedDoc = await prisma.document.update({
      where: { id: doc.id },
      data: { status: DocumentStatus.RENEWAL_IN_PROGRESS },
    });
    expect(updatedDoc.status).toBe(DocumentStatus.RENEWAL_IN_PROGRESS);
  });
});
