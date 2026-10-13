-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'COMPLIANCE_MANAGER', 'UPLOADER', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'RENEWAL_IN_PROGRESS', 'ARCHIVED', 'MISSING');

-- CreateEnum
CREATE TYPE "ComplianceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'PENDING', 'MISSING', 'EXPIRED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('NOT_STARTED', 'INITIATED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "docsafe_tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docsafe_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docsafe_users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docsafe_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docsafe_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docsafe_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docsafe_documents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_asset_id" UUID,
    "owner_user_id" UUID,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "renewal_due_date" DATE,
    "status" "DocumentStatus" NOT NULL,
    "visibility_scope" TEXT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docsafe_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_file_assets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "original_filename" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docsafe_compliance_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" UUID,
    "linked_document_id" UUID,
    "due_date" DATE,
    "severity" "ComplianceSeverity" NOT NULL,
    "status" "ComplianceStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docsafe_compliance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docsafe_renewal_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "initiated_by" UUID NOT NULL,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage" TEXT NOT NULL,
    "remarks" TEXT,
    "completed_at" TIMESTAMP(3),
    "status" "RenewalStatus" NOT NULL,

    CONSTRAINT "docsafe_renewal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docsafe_document_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" TEXT,
    "triggered_by" UUID,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "docsafe_document_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "docsafe_users_email_key" ON "docsafe_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "docsafe_categories_tenant_id_name_key" ON "docsafe_categories"("tenant_id", "name");

-- AddForeignKey
ALTER TABLE "docsafe_users" ADD CONSTRAINT "docsafe_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "docsafe_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_categories" ADD CONSTRAINT "docsafe_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "docsafe_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_documents" ADD CONSTRAINT "docsafe_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "docsafe_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_documents" ADD CONSTRAINT "docsafe_documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "docsafe_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_documents" ADD CONSTRAINT "docsafe_documents_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "docsafe_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_documents" ADD CONSTRAINT "docsafe_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "docsafe_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_documents" ADD CONSTRAINT "docsafe_documents_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "core_file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_file_assets" ADD CONSTRAINT "core_file_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "docsafe_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_file_assets" ADD CONSTRAINT "core_file_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "docsafe_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_compliance_items" ADD CONSTRAINT "docsafe_compliance_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "docsafe_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_compliance_items" ADD CONSTRAINT "docsafe_compliance_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "docsafe_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_compliance_items" ADD CONSTRAINT "docsafe_compliance_items_linked_document_id_fkey" FOREIGN KEY ("linked_document_id") REFERENCES "docsafe_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_renewal_records" ADD CONSTRAINT "docsafe_renewal_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "docsafe_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_renewal_records" ADD CONSTRAINT "docsafe_renewal_records_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "docsafe_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_document_events" ADD CONSTRAINT "docsafe_document_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "docsafe_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docsafe_document_events" ADD CONSTRAINT "docsafe_document_events_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "docsafe_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

