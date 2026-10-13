# Docsafe — Comprehensive Project Overview & Architecture Specification

## 1. Executive Summary & Purpose

**Docsafe** is an enterprise-grade document and compliance management web platform engineered for organizations that need to centralize business documentation, track critical expiration dates, maintain regulatory compliance obligations, manage document renewal lifecycles, and audit organizational activity.

Phase 1 establishes a production-ready, full-stack foundation with real database persistence, strict server-enforced multi-tenant isolation, role-based access control (RBAC), secure multipart file storage, RESTful APIs, and a modern, responsive React frontend.

---

## 2. Technology Stack & Frameworks

| Domain | Technology | Details & Purpose |
|---|---|---|
| **Backend Runtime** | Node.js (v24+) & TypeScript | Modern ESM, strict type checking, and native async support |
| **Backend Framework** | NestJS | Modular enterprise framework with dependency injection and layered architecture |
| **HTTP Engine** | Fastify (`@nestjs/platform-fastify`) | High-throughput HTTP adapter with `@fastify/multipart` for streaming uploads |
| **Database** | PostgreSQL | Relational database with UUID keys, foreign key constraints, and indexing |
| **ORM & Migrations** | Prisma ORM (v6.4.0) | Type-safe schema definition, Prisma Client generation, reproducible migrations |
| **Authentication** | JWT (`@nestjs/jwt`) & bcrypt | Signed bearer tokens with server-side identity validation and password hashing |
| **Frontend Framework** | React 19 + TypeScript | Component-driven SPA architecture |
| **Frontend Tooling** | Vite (v8) | Lightning-fast ESM bundler and development server |
| **Styling & Design** | Tailwind CSS (v4) | Utility-first CSS configured for B2B SaaS density, status badges, and layout |
| **Navigation** | React Router (v7) | Client-side routing with authentication guards |
| **API Client** | Axios | Configured with centralized request/response interceptors for Bearer auth & 401 handling |
| **Icons & Dates** | Lucide React & date-fns | Consistent SVG line icons and timezone-safe date formatting and calculations |
| **Testing** | Vitest | High-speed unit and integration test runner with TypeScript path resolution |

---

## 3. Directory & Module Architecture

The project strictly separates core reusable concerns from domain-specific modules.

```text
d:/docsafe/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Multi-tenant PostgreSQL database schema
│   │   ├── migrations/                # Versioned SQL migrations (20261012000000_init)
│   │   └── seed.ts                    # Reproducible multi-tenant seed script
│   ├── scripts/
│   │   └── start-pg.js                # Embedded native PostgreSQL engine runner
│   ├── src/
│   │   ├── core/                      # Shared infrastructural & security foundations
│   │   │   ├── auth/                  # JWT service, login controller, and JwtAuthGuard
│   │   │   ├── users/                 # User management and tenant user queries
│   │   │   ├── tenants/               # Multi-tenant isolation boundaries
│   │   │   ├── audit/                 # Audit logger service for recording document events
│   │   │   └── storage/               # File storage abstraction & authenticated streaming
│   │   ├── modules/
│   │   │   └── docsafe/               # Feature domain modules
│   │   │       ├── categories/        # Categories CRUD, tenant-scoped uniqueness
│   │   │       ├── documents/         # Documents CRUD, file attachments, renewal triggers
│   │   │       ├── compliance/        # Compliance tracking, severity levels, status updates
│   │   │       ├── dashboard/         # Aggregated counts, recent activity, quick lists
│   │   │       ├── renewals/          # Renewal record lifecycle management
│   │   │       └── search/            # Database-backed search endpoints
│   │   ├── shared/
│   │   │   ├── enums/                 # Centralized domain enums (DocumentStatus, Role, etc.)
│   │   │   └── prisma/                # PrismaClient provider and lifecycle management
│   │   ├── app.module.ts              # Root NestJS module wiring
│   │   └── main.ts                    # Fastify adapter bootstrap, CORS, /api global prefix
│   ├── test/
│   │   └── docsafe.spec.ts            # Automated unit and integration test suite
│   ├── .env                           # Local environment configuration
│   ├── .env.example                   # Template environment configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts              # Centralized Axios instance with auth interceptors
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # React context managing user authentication state
│   │   ├── layouts/
│   │   │   └── Layout.tsx             # Collapsible sidebar, header, and user profile shell
│   │   ├── pages/
│   │   │   ├── Login.tsx              # Clean login screen with validation and error states
│   │   │   ├── Dashboard.tsx          # Real-time metrics, quick lists, recent activity
│   │   │   ├── DocumentList.tsx       # Paginated document table with search and filters
│   │   │   ├── DocumentForm.tsx       # Create/Edit form with multipart upload handling
│   │   │   ├── DocumentDetail.tsx     # Metadata view, file download, renewal, audit timeline
│   │   │   ├── ComplianceList.tsx     # Compliance obligation tracking table
│   │   │   ├── ExpiringSoon.tsx       # Filterable urgent expiring documents (7/15/30 days)
│   │   │   ├── ExpiredDocuments.tsx   # Filtered list of expired documents
│   │   │   └── CategoryList.tsx       # Category management with soft deactivation
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript interfaces and contracts
│   │   ├── App.tsx                    # Route definitions and ProtectedRoute wrapper
│   │   ├── index.css                  # Tailwind CSS root styling and status badge classes
│   │   └── main.tsx                   # React root entrypoint
│   ├── .env                           # Frontend environment variables
│   ├── .env.example
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml                 # Standalone Docker setup for PostgreSQL
└── README.md                          # Quickstart and setup guide
```

---

## 4. Database Schema & Data Models

All business entities are stored in PostgreSQL using UUID primary keys and strictly linked to a tenant.

### 4.1 Entities & Relational Map

1. **`docsafe_tenants`**:
   - `id`: UUID (Primary Key)
   - `name`: Organization name
   - `created_at`, `updated_at`: Timestamps

2. **`docsafe_users`**:
   - `id`: UUID (Primary Key)
   - `tenant_id`: UUID (FK -> `docsafe_tenants.id`)
   - `email`: String (Unique)
   - `password_hash`: String (Bcrypt hashed)
   - `first_name`, `last_name`: String
   - `role`: Enum (`SUPER_ADMIN`, `ORG_ADMIN`, `COMPLIANCE_MANAGER`, `UPLOADER`, `REVIEWER`, `VIEWER`)
   - `created_at`, `updated_at`: Timestamps

3. **`docsafe_categories`**:
   - `id`: UUID (Primary Key)
   - `tenant_id`: UUID (FK -> `docsafe_tenants.id`)
   - `name`: String (Unique constraint across `[tenant_id, name]`)
   - `description`: String (Optional)
   - `is_active`: Boolean (Default `true`)
   - `created_by`: UUID (FK -> `docsafe_users.id`)
   - `created_at`, `updated_at`: Timestamps

4. **`docsafe_documents`**:
   - `id`: UUID (Primary Key)
   - `tenant_id`: UUID (FK -> `docsafe_tenants.id`)
   - `category_id`: UUID (FK -> `docsafe_categories.id`)
   - `title`: String
   - `description`: Text (Optional)
   - `file_asset_id`: UUID (Optional, FK -> `core_file_assets.id`)
   - `owner_user_id`: UUID (Optional, FK -> `docsafe_users.id`)
   - `issue_date`: Date
   - `expiry_date`: Date
   - `renewal_due_date`: Date (Optional)
   - `status`: Enum (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `RENEWAL_IN_PROGRESS`, `ARCHIVED`, `MISSING`)
   - `visibility_scope`: String (Optional, e.g. `ORGANIZATION`)
   - `uploaded_by`: UUID (FK -> `docsafe_users.id`)
   - `created_at`, `updated_at`: Timestamps

5. **`core_file_assets`**:
   - `id`: UUID (Primary Key)
   - `tenant_id`: UUID (FK -> `docsafe_tenants.id`)
   - `original_filename`: String
   - `storage_key`: String (Safe isolated path: `<tenant_id>/<file_uuid>-<safe_filename>`)
   - `mime_type`: String (Validated against PDF, PNG, JPG, JPEG)
   - `size_bytes`: Integer
   - `checksum`: String (Optional)
   - `uploaded_by`: UUID (FK -> `docsafe_users.id`)
   - `created_at`: Timestamp

6. **`docsafe_compliance_items`**:
   - `id`: UUID (Primary Key)
   - `tenant_id`: UUID (FK -> `docsafe_tenants.id`)
   - `name`: String
   - `category_id`: UUID (Optional, FK -> `docsafe_categories.id`)
   - `linked_document_id`: UUID (Optional, FK -> `docsafe_documents.id`)
   - `due_date`: Date (Optional)
   - `severity`: Enum (`LOW`, `MEDIUM`, `HIGH`)
   - `status`: Enum (`COMPLIANT`, `PENDING`, `MISSING`, `EXPIRED`, `UNDER_REVIEW`)
   - `notes`: Text (Optional)
   - `created_at`, `updated_at`: Timestamps

7. **`docsafe_renewal_records`**:
   - `id`: UUID (Primary Key)
   - `tenant_id`: UUID (FK -> `docsafe_tenants.id`)
   - `document_id`: UUID (FK -> `docsafe_documents.id`)
   - `initiated_by`: UUID (FK -> `docsafe_users.id`)
   - `initiated_at`: Timestamp
   - `stage`: String (e.g., `Initiated`, `Legal Review`, `Completed`)
   - `remarks`: Text (Optional)
   - `completed_at`: Timestamp (Optional)
   - `status`: Enum (`NOT_STARTED`, `INITIATED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`)

8. **`docsafe_document_events`**:
   - `id`: UUID (Primary Key)
   - `tenant_id`: UUID (FK -> `docsafe_tenants.id`)
   - `document_id`: UUID (FK -> `docsafe_documents.id`)
   - `event_type`: String (`DOCUMENT_CREATED`, `FILE_UPLOADED`, `DOCUMENT_METADATA_UPDATED`, `RENEWAL_INITIATED`, `COMPLIANCE_STATUS_UPDATED`)
   - `payload_json`: JSON string storing metadata changes
   - `triggered_by`: UUID (FK -> `docsafe_users.id`)
   - `triggered_at`: Timestamp

---

## 5. Centralized Business Rules & Calculations

### 5.1 Document Status Resolution
A dedicated calculation engine evaluates document statuses based on calendar dates:
1. **`ARCHIVED`**: Retains precedence if explicitly marked by an administrator.
2. **`RENEWAL_IN_PROGRESS`**: Takes precedence when an active renewal record is in `INITIATED` or `IN_PROGRESS` state.
3. **`EXPIRED`**: Triggered when `expiry_date < today` (calendar date comparison avoiding timezone shift issues).
4. **`EXPIRING_SOON`**: Triggered when `today <= expiry_date <= today + 30 days`.
5. **`ACTIVE`**: Default state for valid, non-expired documents.

### 5.2 Date & Validation Integrity
- `expiry_date` must be strictly $\ge$ `issue_date`.
- `renewal_due_date` must not be later than `expiry_date`.
- Category names are strictly unique within each individual tenant. Cross-tenant duplicates are allowed.
- Linked documents, categories, owners, and file assets must belong to the caller's authenticated `tenant_id`. Any cross-tenant reference is rejected with `BadRequestException` or `NotFoundException`.

---

## 6. Security & Multi-Tenant Data Isolation

1. **Server-Derived Identity**:
   Every request extracts `tenantId` and `userId` directly from the cryptographically verified JWT payload inside `JwtAuthGuard`. The client can never pass an untrusted `tenant_id` to spoof access.
2. **Strict Query Scoping**:
   Every Prisma query in every repository and service incorporates `where: { tenantId }`. Cross-tenant record lookups return 404 Not Found to prevent metadata leaking.
3. **Password Security**:
   Passwords are never stored in plaintext; salted and hashed via `bcrypt` (10 rounds).
4. **Role-Based Access Control (RBAC)**:
   A 6-tier role matrix governs operations:
   - **Super Admin**: Platform oversight.
   - **Org Admin**: Full control over organization users, categories, and documents.
   - **Compliance Manager**: Manage compliance obligations and renewal workflows.
   - **Uploader**: Create documents and upload files.
   - **Reviewer**: Review records and update compliance statuses.
   - **Viewer**: Read-only access to authorized records.
5. **Safe File Streaming**:
   Uploaded files are stored outside public web folders with generated UUID keys. File downloads are routed through authenticated endpoints (`GET /api/docsafe/documents/:id/file`) verifying tenant access and returning safe `Content-Disposition` and `Content-Type` headers.

---

## 7. REST API Contract Specification

All endpoints are prefixed with `/api`. Responses adhere strictly to the standardized envelope:

**Success Response Envelope:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

**Error Response Envelope:**
```json
{
  "success": false,
  "message": "A clear error message",
  "errors": []
}
```

### 7.1 Implemented Endpoints

#### Authentication & Users
- `POST /api/auth/login` — Authenticates user via email & password, returns JWT token and user profile.
- `GET /api/auth/me` — Returns current authenticated user and tenant info.
- `GET /api/auth/users` — Returns list of tenant users for owner assignments.

#### Categories
- `GET /api/docsafe/categories` — Lists all tenant categories.
- `GET /api/docsafe/categories/:id` — Details of a specific category.
- `POST /api/docsafe/categories` — Creates a category with uniqueness check.
- `PUT /api/docsafe/categories/:id` — Updates category metadata.
- `DELETE /api/docsafe/categories/:id` — Soft-deactivates or deletes category.

#### Documents
- `GET /api/docsafe/documents` — Lists documents with pagination (`page`, `limit`), title search, category filter, and status filter.
- `GET /api/docsafe/documents/:id` — Full details including owner, category, file asset, renewals, and history.
- `POST /api/docsafe/documents` — Creates document record with date validations and automatic status computation.
- `PUT /api/docsafe/documents/:id` — Updates document metadata.
- `POST /api/docsafe/documents/:id/upload` — Fastify multipart file upload (PDF/PNG/JPG up to 10MB).
- `GET /api/docsafe/documents/:id/file` — Streams file attachment with authenticated tenant check.
- `POST /api/docsafe/documents/:id/renewal` — Initiates document renewal workflow.
- `GET /api/docsafe/documents/:id/history` — Chronological audit event log.

#### Compliance Items
- `GET /api/docsafe/compliance-items` — Lists compliance obligations with pagination and filters (`search`, `status`, `severity`).
- `GET /api/docsafe/compliance-items/:id` — Fetches compliance item details.
- `POST /api/docsafe/compliance-items` — Creates compliance obligation with optional document link.
- `PUT /api/docsafe/compliance-items/:id` — Updates status (`COMPLIANT`, `PENDING`, `MISSING`, `EXPIRED`, `UNDER_REVIEW`) or metadata.

#### Dashboard
- `GET /api/docsafe/dashboard/summary` — Returns real-time counts (`totalDocuments`, `activeDocuments`, `expiringSoon`, `expired`, `missingCompliance`, `renewalsInProgress`), recent 10 audit events, and quick lists.
- `GET /api/docsafe/dashboard/expiring-soon` — Returns documents expiring within 30 days (or custom query `?days=15`).
- `GET /api/docsafe/dashboard/expired` — Returns expired documents.
- `GET /api/docsafe/dashboard/missing` — Returns missing compliance items.

#### Search
- `GET /api/docsafe/search/documents` — Database-backed search across document titles.
- `GET /api/docsafe/search/compliance-items` — Database-backed search across compliance items.

---

## 8. Frontend User Experience & Screens

The user interface is designed with a light neutral aesthetic, deep slate typography, and clear status accents:

1. **Login Page (`/login`)**:
   - Branded Docsafe login form with show/hide password toggle, loading indicator, and inline error alerts.
2. **Dashboard (`/dashboard`)**:
   - 6 KPI metric cards with icons and color-coded status badges: Total Documents, Active, Expiring Soon, Expired, Missing Compliance, Renewal in Progress.
   - Recent Activity timeline with chronological event tags.
   - Quick list sections for fast navigation to urgent expiring documents and missing compliance obligations.
3. **Documents List (`/documents`)**:
   - Data table displaying Title, Category, Owner, Issue Date, Expiry Date, Status Badge, and Actions.
   - Integrated search bar and dropdown filters (Status, Category) with a Reset button.
   - Server-side pagination controls (Previous / Next / page counters).
4. **Add / Edit Document (`/documents/new`, `/documents/:id/edit`)**:
   - Form fields: Title, Category (dynamic dropdown), Owner (dynamic dropdown), Issue Date, Expiry Date, Renewal Due Date, Description.
   - Drag-and-drop / file picker for PDF, PNG, and JPG files.
   - Real-time client-side validation preventing invalid date ranges and oversized files.
5. **Document Detail View (`/documents/:id`)**:
   - Comprehensive metadata card with status badges.
   - File attachment card with working **View File** and **Download File** actions.
   - **Start Renewal** button triggering an interactive confirmation and backend transition.
   - Chronological event timeline showing document creation, file uploads, metadata updates, and renewals.
6. **Expiring Soon (`/expiring-soon`)**:
   - Filterable view highlighting remaining days left and urgency badges.
7. **Expired Documents (`/expired`)**:
   - Filtered view showing documents requiring remediation or archiving.
8. **Compliance List (`/compliance`)**:
   - Obligations table showing Severity (LOW / MEDIUM / HIGH), Status, Due Date, and Linked Documents.
9. **Categories Management (`/categories`)**:
   - Accessible to Org Admins and Super Admins for viewing, editing, and activating/deactivating categories.

---

## 9. Verification & Automated Testing

### 9.1 Automated Test Results
The test suite in `backend/test/docsafe.spec.ts` executes against the real PostgreSQL database:
- **Authentication & Hashing**: Verified `bcrypt.compare` with valid and invalid passwords.
- **Category Uniqueness**: Confirmed duplicate category names are rejected within a tenant, but accepted across different tenants.
- **Document Creation & Status**: Validated date calculations and status assignment.
- **Tenant Isolation**: Confirmed that queries executed under Tenant A return zero records belonging to Tenant B.
- **Renewal Lifecycle**: Verified renewal record insertion and document status mutation to `RENEWAL_IN_PROGRESS`.

**Execution Output:**
```text
✓ test/docsafe.spec.ts (5 tests) 386ms
✓ src/app.controller.spec.ts (1 test) 2943ms
Test Files  2 passed (2)
Tests       6 passed (6)
```

### 9.2 Build Verification
- **Backend:** `nest build` completed with **0 errors**.
- **Frontend:** `tsc -b && vite build` bundled 2286 modules in **2.73s** with **0 type errors**.

---

## 10. How to Run the Application Locally

### Step 1: Start PostgreSQL
An embedded native PostgreSQL instance is configured in the repository:
```bash
cd backend
node scripts/start-pg.js
```
*(Alternatively, you can run `docker-compose up -d` to use the standard PostgreSQL container on port 5432).*

### Step 2: Start the Backend
```bash
cd backend
npm run start:prod
# Or in watch mode for development:
# npm run start:dev
```
The REST API will be listening at **`http://localhost:3000/api`**.

### Step 3: Start the Frontend
```bash
cd frontend
npm run dev
```
The web application will be accessible at **`http://localhost:5173`**.

---

## 11. Seeded Demo Accounts

All seeded accounts use password: **`password123`**

| Role | Email | Tenant |
|---|---|---|
| **Super Admin** | `admin@docsafe.local` | Docsafe Global Corp |
| **Org Admin** | `orgadmin@docsafe.local` | Docsafe Global Corp |
| **Compliance Manager** | `compliance@docsafe.local` | Docsafe Global Corp |
| **Uploader** | `uploader@docsafe.local` | Docsafe Global Corp |
| **Reviewer** | `reviewer@docsafe.local` | Docsafe Global Corp |
| **Viewer** | `viewer@docsafe.local` | Docsafe Global Corp |
| **Org Admin (Tenant B)** | `tenant_b_admin@acme.local` | Acme Logistics Ltd (Isolated) |

---
*Generated for Docsafe Phase 1 Deliverables.*
