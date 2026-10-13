import { PrismaClient, Role, DocumentStatus, ComplianceSeverity, ComplianceStatus, RenewalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Primary Tenant
  let tenantA = await prisma.tenant.findFirst({ where: { name: 'Docsafe Global Corp' } });
  if (!tenantA) {
    tenantA = await prisma.tenant.create({
      data: { name: 'Docsafe Global Corp' },
    });
  }

  // 2. Primary Tenant Users
  const usersData = [
    { email: 'admin@docsafe.local', firstName: 'Alexander', lastName: 'Pierce', role: Role.SUPER_ADMIN },
    { email: 'orgadmin@docsafe.local', firstName: 'Sarah', lastName: 'Connor', role: Role.ORG_ADMIN },
    { email: 'compliance@docsafe.local', firstName: 'Elena', lastName: 'Rostova', role: Role.COMPLIANCE_MANAGER },
    { email: 'uploader@docsafe.local', firstName: 'David', lastName: 'Miller', role: Role.UPLOADER },
    { email: 'reviewer@docsafe.local', firstName: 'Marcus', lastName: 'Vance', role: Role.REVIEWER },
    { email: 'viewer@docsafe.local', firstName: 'Chloe', lastName: 'Decker', role: Role.VIEWER },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          tenantId: tenantA.id,
          email: u.email,
          passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
        },
      });
    }
    createdUsers[u.role] = user;
  }

  const adminUser = createdUsers[Role.SUPER_ADMIN];

  // 3. Categories
  const categoryNames = [
    { name: 'Licenses & Permits', desc: 'Government trade and operational licenses' },
    { name: 'Corporate Agreements', desc: 'Client contracts, NDAs, and SLAs' },
    { name: 'Tax & Financial', desc: 'Audited financials, tax filings, and GST' },
    { name: 'Insurance Policies', desc: 'General liability, health, and property insurance' },
    { name: 'Vendor Documents', desc: 'Supplier agreements and vendor compliance certificates' },
    { name: 'Employee Documents', desc: 'Handbooks, employment agreements, and policies' },
  ];

  const createdCategories: Record<string, any> = {};
  for (const cat of categoryNames) {
    let category = await prisma.category.findFirst({
      where: { tenantId: tenantA.id, name: cat.name },
    });
    if (!category) {
      category = await prisma.category.create({
        data: {
          tenantId: tenantA.id,
          name: cat.name,
          description: cat.desc,
          isActive: true,
          createdBy: adminUser.id,
        },
      });
    }
    createdCategories[cat.name] = category;
  }

  // 4. Sample File Asset
  const sampleUploadsDir = path.join(process.cwd(), 'uploads', tenantA.id);
  fs.mkdirSync(sampleUploadsDir, { recursive: true });
  const sampleFilePath = path.join(sampleUploadsDir, 'sample_trade_license.pdf');
  if (!fs.existsSync(sampleFilePath)) {
    fs.writeFileSync(sampleFilePath, '%PDF-1.4\n1 0 obj\n<< /Title (Docsafe Sample License) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  }

  let sampleFileAsset = await prisma.fileAsset.findFirst({ where: { tenantId: tenantA.id } });
  if (!sampleFileAsset) {
    sampleFileAsset = await prisma.fileAsset.create({
      data: {
        tenantId: tenantA.id,
        originalFilename: 'trade_license_2026.pdf',
        storageKey: `${tenantA.id}/sample_trade_license.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        uploadedBy: adminUser.id,
      },
    });
  }

  // 5. Documents (Active, Expiring Soon, Expired, Renewal in Progress)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const docsToSeed = [
    {
      title: 'Commercial Trade License 2026',
      cat: 'Licenses & Permits',
      issue: new Date(today.getFullYear(), today.getMonth() - 6, 1),
      expiry: new Date(today.getFullYear() + 1, today.getMonth(), 1), // ACTIVE
      renewalDue: new Date(today.getFullYear() + 1, today.getMonth() - 1, 1),
      status: DocumentStatus.ACTIVE,
      desc: 'Annual commercial municipal operating license',
      fileAssetId: sampleFileAsset.id,
    },
    {
      title: 'ISO 27001 Security Certification',
      cat: 'Licenses & Permits',
      issue: new Date(today.getFullYear() - 1, today.getMonth(), 1),
      expiry: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // EXPIRING SOON (14 days)
      renewalDue: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: DocumentStatus.EXPIRING_SOON,
      desc: 'Information security management system certificate',
      fileAssetId: sampleFileAsset.id,
    },
    {
      title: 'Commercial Property Insurance Policy',
      cat: 'Insurance Policies',
      issue: new Date(today.getFullYear() - 1, today.getMonth() - 2, 1),
      expiry: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), // EXPIRED
      renewalDue: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      status: DocumentStatus.EXPIRED,
      desc: 'Headquarters commercial property risk insurance policy',
      fileAssetId: sampleFileAsset.id,
    },
    {
      title: 'Cloud Infrastructure Master Services Agreement',
      cat: 'Corporate Agreements',
      issue: new Date(today.getFullYear() - 2, today.getMonth(), 1),
      expiry: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000), // EXPIRING SOON
      renewalDue: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: DocumentStatus.RENEWAL_IN_PROGRESS,
      desc: 'AWS primary cloud enterprise agreement',
      fileAssetId: sampleFileAsset.id,
    },
  ];

  const createdDocs: any[] = [];
  for (const d of docsToSeed) {
    let doc = await prisma.document.findFirst({
      where: { tenantId: tenantA.id, title: d.title },
    });
    if (!doc) {
      doc = await prisma.document.create({
        data: {
          tenantId: tenantA.id,
          categoryId: createdCategories[d.cat].id,
          title: d.title,
          description: d.desc,
          issueDate: d.issue,
          expiryDate: d.expiry,
          renewalDueDate: d.renewalDue,
          status: d.status,
          uploadedBy: adminUser.id,
          ownerUserId: adminUser.id,
          fileAssetId: d.fileAssetId,
        },
      });
      // Audit event
      await prisma.documentEvent.create({
        data: {
          tenantId: tenantA.id,
          documentId: doc.id,
          eventType: 'DOCUMENT_CREATED',
          triggeredBy: adminUser.id,
          payloadJson: JSON.stringify({ title: doc.title, status: doc.status }),
        },
      });
    }
    createdDocs.push(doc);
  }

  // 6. Renewal Record for Renewal in Progress Document
  const renewalDoc = createdDocs.find(d => d.status === DocumentStatus.RENEWAL_IN_PROGRESS);
  if (renewalDoc) {
    const existingRenewal = await prisma.renewalRecord.findFirst({
      where: { documentId: renewalDoc.id },
    });
    if (!existingRenewal) {
      await prisma.renewalRecord.create({
        data: {
          tenantId: tenantA.id,
          documentId: renewalDoc.id,
          initiatedBy: adminUser.id,
          stage: 'Legal Review',
          remarks: 'Terms renegotiation with vendor underway',
          status: RenewalStatus.IN_PROGRESS,
        },
      });
      await prisma.documentEvent.create({
        data: {
          tenantId: tenantA.id,
          documentId: renewalDoc.id,
          eventType: 'RENEWAL_INITIATED',
          triggeredBy: adminUser.id,
          payloadJson: JSON.stringify({ stage: 'Legal Review' }),
        },
      });
    }
  }

  // 7. Compliance Items
  const complianceData = [
    {
      name: 'Annual Fire Safety Audit Certification',
      cat: 'Licenses & Permits',
      doc: createdDocs[0]?.id,
      dueDate: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000),
      severity: ComplianceSeverity.HIGH,
      status: ComplianceStatus.PENDING,
      notes: 'Third party inspection scheduled for next week',
    },
    {
      name: 'Mandatory Data Privacy Compliance Assessment',
      cat: 'Corporate Agreements',
      doc: null,
      dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      severity: ComplianceSeverity.HIGH,
      status: ComplianceStatus.MISSING,
      notes: 'No documentation provided for GDPR/DPDP audit',
    },
    {
      name: 'Quarterly Corporate Tax Filing Verification',
      cat: 'Tax & Financial',
      doc: null,
      dueDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
      severity: ComplianceSeverity.MEDIUM,
      status: ComplianceStatus.COMPLIANT,
      notes: 'Advance tax receipts filed on time',
    },
  ];

  for (const c of complianceData) {
    const existing = await prisma.complianceItem.findFirst({
      where: { tenantId: tenantA.id, name: c.name },
    });
    if (!existing) {
      await prisma.complianceItem.create({
        data: {
          tenantId: tenantA.id,
          name: c.name,
          categoryId: createdCategories[c.cat]?.id,
          linkedDocumentId: c.doc || null,
          dueDate: c.dueDate,
          severity: c.severity,
          status: c.status,
          notes: c.notes,
        },
      });
    }
  }

  // 8. Secondary Tenant (For Tenant Isolation verification)
  let tenantB = await prisma.tenant.findFirst({ where: { name: 'Acme Logistics Ltd' } });
  if (!tenantB) {
    tenantB = await prisma.tenant.create({
      data: { name: 'Acme Logistics Ltd' },
    });
    const userB = await prisma.user.create({
      data: {
        tenantId: tenantB.id,
        email: 'tenant_b_admin@acme.local',
        passwordHash,
        firstName: 'Bob',
        lastName: 'Williams',
        role: Role.ORG_ADMIN,
      },
    });
    const catB = await prisma.category.create({
      data: {
        tenantId: tenantB.id,
        name: 'Confidential Fleet Permits',
        createdBy: userB.id,
      },
    });
    await prisma.document.create({
      data: {
        tenantId: tenantB.id,
        categoryId: catB.id,
        title: 'Acme Confidential Fleet Contract 2026',
        issueDate: today,
        expiryDate: new Date(today.getFullYear() + 1, today.getMonth(), 1),
        status: DocumentStatus.ACTIVE,
        uploadedBy: userB.id,
      },
    });
  }

  console.log('Seeding completed successfully!');
  console.log('Login credentials: admin@docsafe.local / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });