# Docsafe Phase 1 — Document & Compliance Management System

Docsafe is a robust, multi-tenant document and compliance management web application designed for organizations to manage business documents, track expiration dates, fulfill compliance obligations, handle renewals, and audit document activities.

---

## 🛠 Technology Stack

### Backend
- **Runtime:** Node.js (v24+) & TypeScript
- **Framework:** NestJS
- **HTTP Adapter:** Fastify
- **Database:** PostgreSQL (with embedded native engine support)
- **ORM:** Prisma ORM
- **Authentication:** JWT & bcrypt
- **Access Control:** Role-Based Access Control (RBAC) & Multi-Tenant Data Isolation
- **Storage:** Local file system abstraction layer with safe key naming

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **HTTP Client:** Axios with centralized interceptors
- **Icons:** Lucide React

---

## 🚀 Running the Application

Both backend and frontend servers are currently live and configured.

- **Web Application URL:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:3000/api](http://localhost:3000/api)

### Development Credentials (Seeded)

All test accounts use the password: `password123`

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@docsafe.local` | `password123` |
| **Org Admin** | `orgadmin@docsafe.local` | `password123` |
| **Compliance Manager** | `compliance@docsafe.local` | `password123` |
| **Uploader** | `uploader@docsafe.local` | `password123` |
| **Reviewer** | `reviewer@docsafe.local` | `password123` |
| **Viewer** | `viewer@docsafe.local` | `password123` |

*(A secondary isolated tenant `Acme Logistics Ltd` with account `tenant_b_admin@acme.local` is also seeded for tenant isolation validation.)*

---

## 📁 Project Structure

```text
d:/docsafe/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Multi-tenant PostgreSQL schema
│   │   ├── migrations/           # Versioned migrations
│   │   └── seed.ts               # Reproducible seed script
│   ├── src/
│   │   ├── core/
│   │   │   ├── auth/             # JWT auth, guards, login
│   │   │   ├── users/            # Users management
│   │   │   ├── tenants/          # Multi-tenant boundaries
│   │   │   ├── audit/            # Centralized event & audit logging
│   │   │   └── storage/          # Storage abstraction & file streaming
│   │   ├── modules/
│   │   │   └── docsafe/
│   │   │       ├── categories/   # Categories CRUD & uniqueness
│   │   │       ├── documents/    # Documents CRUD, uploads, renewal
│   │   │       ├── compliance/   # Compliance obligations & severities
│   │   │       ├── dashboard/    # Real-time tenant statistics & quick lists
│   │   │       ├── renewals/     # Lifecycle & stage tracking
│   │   │       └── search/       # Database-backed search
│   │   ├── shared/
│   │   │   ├── enums/            # Centralized enums
│   │   │   └── prisma/           # Prisma service & module
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── test/
│       └── docsafe.spec.ts       # Automated business & isolation test suite
└── frontend/
    └── src/
        ├── api/client.ts         # Axios client with auth interceptors
        ├── contexts/             # AuthContext
        ├── layouts/Layout.tsx    # Responsive SaaS sidebar & shell
        ├── pages/
        │   ├── Login.tsx
        │   ├── Dashboard.tsx     # Metrics, quick lists, recent activity
        │   ├── DocumentList.tsx  # Search, filters, pagination
        │   ├── DocumentForm.tsx  # Document creation & file upload
        │   ├── DocumentDetail.tsx# Details, file download, history
        │   ├── ComplianceList.tsx# Compliance tracking & severity
        │   ├── ExpiringSoon.tsx  # Filter by expiring days
        │   ├── ExpiredDocuments.tsx
        │   └── CategoryList.tsx  # Category management
        ├── types/                # Strict TypeScript contracts
        └── App.tsx               # Routing & protected routes
```

---

## 🧪 Testing & Verification

Run the automated backend test suite:
```bash
cd backend
npm run test
```

Run production builds:
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```
