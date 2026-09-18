# Agri-Pharmacy SaaS - Architecture & Implementation Plan

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React 18 + TypeScript + Vite | Modern, fast, type-safe |
| **UI Library** | shadcn/ui + Tailwind CSS | Accessible, customizable, RTL-ready |
| **State** | TanStack Query + Zustand | Server state + client state separation |
| **Routing** | React Router v6 | Standard, nested routes |
| **i18n** | i18next | Industry standard, RTL support |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Charts** | Recharts | React-native, Arabic labels |
| **Backend** | NestJS + TypeScript | OOP, modular, DI, multi-tenant guards |
| **Database** | PostgreSQL + Prisma ORM | Type-safe, migrations, multi-tenant patterns |
| **Auth** | **Clerk** (Recommended) | Multi-tenant, organizations, MFA, Arabic UI |
| **Validation** | class-validator + class-transformer | Decorator-based, DTOs |
| **API Docs** | Swagger/OpenAPI | Auto-generated from decorators |
| **Deployment** | Docker + Docker Compose (dev), Railway/Render (prod) | Consistent environments |

---

## Multi-Tenancy Strategy: Shared Database, Shared Schema (Row-Level Security)

**Why**: Best balance of isolation, cost, and operational simplicity for SaaS.

### Implementation
- Every table has `tenant_id` (UUID, FK to `tenants` table)
- Prisma middleware automatically adds `tenant_id` to all queries
- NestJS Guard extracts `tenant_id` from JWT (Clerk organization claim)
- RLS policies in PostgreSQL as defense-in-depth

### Tables

```sql
-- Core
tenants (id, name, slug, plan, status, settings, created_at)
users (id, clerk_id, tenant_id, role, name, email, phone, created_at)

-- Inventory
products (id, tenant_id, trade_name, active_ingredient, pesticide_type, usage_notes, unit_type, min_threshold, created_at)
inventory_batches (id, product_id, tenant_id, batch_number, quantity, unit_cost, expiry_date, received_at)
stock_movements (id, tenant_id, product_id, batch_id, type, quantity, reference_type, reference_id, notes, created_at)

-- Debt Ledger
customers (id, tenant_id, name, type, phone, address, notes, created_at)
debts (id, tenant_id, customer_id, amount, status, due_date, notes, created_at)
debt_payments (id, debt_id, tenant_id, amount, paid_at, method, notes)

-- Sales/Expenses
sales (id, tenant_id, customer_id, total_amount, discount, tax, status, sale_date, notes)
sale_items (id, sale_id, tenant_id, product_id, batch_id, quantity, unit_price, total)
expenses (id, tenant_id, category, amount, expense_date, description, receipt_url)
```

---

## Module Structure (NestJS - OOP/Modular)

```
src/
├── common/                    # Shared: guards, interceptors, pipes, decorators
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── tenant.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── current-tenant.decorator.ts
│   └── prisma/
│       ├── prisma.service.ts
│       └── prisma.middleware.ts  # Auto tenant_id injection
├── config/                    # Configuration modules
├── modules/
│   ├── auth/                  # Clerk webhook sync, session management
│   ├── tenants/               # Super-admin: tenant CRUD, plans, status
│   ├── users/                 # Tenant users, roles, invitations
│   ├── products/              # Product catalog, search, categories
│   ├── inventory/             # Stock, batches, movements, thresholds
│   ├── customers/             # Farmers/producers, debt ledger
│   ├── debts/                 # Debt tracking, payments, aging reports
│   ├── sales/                 # POS, invoices, returns
│   ├── expenses/              # Expense tracking, categories
│   ├── reports/               # Dashboard, daily/weekly/monthly/yearly
│   └── settings/              # Tenant settings, units, categories
├── app.module.ts
└── main.ts
```

---

## Frontend Structure (React + TypeScript)

```
src/
├── app/                       # App shell, providers, routing
│   ├── providers.tsx          # QueryClient, Auth, i18n, Theme
│   ├── routes.tsx             # Route definitions + lazy loading
│   └── layout/                # Sidebar, Header, Footer
├── features/                  # Feature modules (domain-driven)
│   ├── inventory/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── types.ts
│   ├── debts/
│   ├── products/
│   ├── sales/
│   ├── expenses/
│   ├── reports/
│   └── settings/
├── shared/                    # Cross-cutting
│   ├── components/ui/         # shadcn components
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   └── types/
├── i18n/                      # Translation files
│   ├── ar.json
│   └── en.json
└── styles/                    # Global styles, RTL utilities
```

---

## API Endpoints (RESTful, Tenant-Scoped)

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/sync` (Clerk webhook), `GET /auth/me` |
| **Tenants (SuperAdmin)** | `GET/POST /admin/tenants`, `PATCH /admin/tenants/:id/plan`, `PATCH /admin/tenants/:id/status` |
| **Products** | `GET/POST /products`, `GET/PATCH/DELETE /products/:id`, `GET /products/search?q=` |
| **Inventory** | `GET /inventory`, `GET /inventory/low-stock`, `POST /inventory/adjust`, `GET /inventory/movements` |
| **Customers** | `GET/POST /customers`, `GET/PATCH/DELETE /customers/:id`, `GET /customers/:id/debts` |
| **Debts** | `GET/POST /debts`, `GET /debts/aging`, `POST /debts/:id/payments` |
| **Sales** | `GET/POST /sales`, `GET /sales/:id`, `POST /sales/:id/return` |
| **Expenses** | `GET/POST /expenses`, `GET /expenses/summary` |
| **Reports** | `GET /reports/dashboard`, `GET /reports/sales?period=`, `GET /reports/inventory`, `GET /reports/profit-loss` |

---

## UI/UX Requirements

- **RTL-first**: All layouts, tables, forms RTL by default
- **Tooltips**: Every input, button, icon has `Tooltip` with clear Arabic description
- **Responsive**: Mobile-first, breakpoints: 640/1024/1280px
- **Accessibility**: WCAG AA, keyboard navigation, screen readers
- **Loading states**: Skeletons for lists, spinners for actions
- **Empty states**: Illustrated, with CTA to create first record

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Repo setup: monorepo (Nx/Turborepo) or separate frontend/backend
- [ ] Docker Compose: Postgres, Redis, Backend, Frontend
- [ ] Prisma schema + migrations
- [ ] NestJS bootstrap: config, Prisma, Clerk, Swagger
- [ ] React bootstrap: Vite, Tailwind, shadcn, i18n, Router
- [ ] Auth integration: Clerk webhook → sync user/tenant
- [ ] Tenant middleware + Guard

### Phase 2: Core Domain (Week 3-4)
- [ ] Products CRUD + Search (trade name, active ingredient, type)
- [ ] Inventory: batches, stock movements, low-stock alerts
- [ ] Units of measure: kg, box, seeds + conversion (future-ready)

### Phase 3: Debt Ledger (Week 5)
- [ ] Customers (farmers/producers) CRUD
- [ ] Debts: create, list, filter, sort (most/least owed)
- [ ] Payments: record, history, aging report

### Phase 4: Sales & Expenses (Week 6)
- [ ] POS-style sale creation (cart + customer + payment)
- [ ] Sale items from inventory batches (FIFO)
- [ ] Expenses: categories, receipts, recurring

### Phase 5: Reports & Dashboard (Week 7)
- [ ] Dashboard: KPIs, charts, recent activity
- [ ] Sales reports: daily/weekly/monthly/6mo/yearly
- [ ] Inventory valuation, profit/loss, debt aging
- [ ] Export: Excel (future: PDF)

### Phase 6: Settings & Polish (Week 8)
- [ ] Tenant settings: info, units, categories, thresholds
- [ ] User management: invite, roles, deactivate
- [ ] SuperAdmin panel: tenants, plans, status toggle
- [ ] PWA: manifest, service worker, offline queue
- [ ] E2E tests (Playwright), CI/CD pipeline

---

## Super Admin vs Tenant User Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| **SuperAdmin** | Global | Manage tenants, plans, status, view all data |
| **TenantAdmin** | Single Tenant | All tenant features, user management, settings |
| **Manager** | Single Tenant | Inventory, sales, debts, reports, customers |
| **Salesperson** | Single Tenant | Sales, customers, view inventory |
| **Viewer** | Single Tenant | Read-only reports, inventory |

---

## Open Decisions (Need Your Input)

1. **Monorepo vs Separate Repos**: Nx/Turborepo (single repo) or two repos?
2. **Unit Conversions**: Build conversion engine now (box=5kg) or defer?
3. **Expiry Alerts**: Background job (cron) or on-demand check?
4. **Audit Log**: Full event sourcing or simple `audit_logs` table?
5. **File Uploads**: Receipts/images - S3/R2/local? Clerk handles avatars.
6. **Real-time**: WebSocket for low-stock alerts? (Socket.io/Pusher)

---

## Changelog Template

```markdown
# CHANGELOG.md

## [Unreleased]
### Added
- 
### Changed
- 
### Fixed
- 

## [0.1.0] - 2026-09-14
### Added
- Initial architecture document
- Tech stack decisions
- Database schema design
- Module breakdown
```

---

## Next Steps

1. **Confirm** this architecture
2. **Decide** on open questions above
3. **I'll create** the detailed SPEC.md with API contracts, DTOs, UI wireframes
4. **Then implement** Phase 1 with full documentation + GitHub pushes