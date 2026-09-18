# CHANGELOG

## [Unreleased]
### Added
- Complete Phase 1: Foundation implementation
- Nx Monorepo structure with backend (NestJS) and frontend (React + Vite)
- Docker Compose setup with PostgreSQL, Redis, Backend, Frontend
- Prisma schema with full multi-tenant models (Tenant, User, Product, InventoryBatch, StockMovement, Customer, Debt, DebtPayment, Sale, SaleItem, Expense, AuditLog)
- Authentication module with Clerk integration (webhook sync, JWT strategy)
- Multi-tenancy middleware (automatic tenant_id injection via Prisma middleware)
- Role-based access control (SUPER_ADMIN, TENANT_ADMIN, MANAGER, SALESPERSON, VIEWER)
- SuperAdmin module for tenant management (plans, status, settings)
- User management module (invite, roles, activate/deactivate)
- Products module (CRUD, search by trade name/active ingredient, pesticide types, low stock alerts)
- Inventory module (batches, stock movements, receive/adjust stock, expiry tracking)
- Customers module (CRUD, search, sort by debt, top debtors)
- Debts module (CRUD, payments, aging report)
- Sales module (POS, items, discounts, tax, returns, daily summary)
- Expenses module (CRUD, categories, summary by period)
- Reports module (dashboard KPIs, sales reports, inventory valuation, profit & loss)
- Settings module (tenant settings, units, categories)
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Frontend: i18n with Arabic (RTL) and English support
- Frontend: TanStack Query for server state management
- Frontend: React Hook Form + Zod for form validation
- Frontend: Clerk authentication integration
- Frontend: All feature pages (Dashboard, Products, Inventory, Customers, Debts, Sales, Expenses, Reports, Settings, Users)
- Frontend: Shared UI components (Button, Input, Select, Table, Card, Badge, Dialog, Toast, Tooltip, Switch)
- Frontend: RTL-first design with Cairo font
- API documentation with Swagger/OpenAPI

## [0.1.0] - 2026-09-16
### Added
- Initial architecture & implementation plan
- Tech stack decisions documented
- Database schema design
- Module breakdown
- Implementation phases defined