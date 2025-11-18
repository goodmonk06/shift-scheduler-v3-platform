# Shift Scheduler v3 Platform

A production-ready, multi-tenant SaaS platform for shift scheduling. Built with NestJS, Next.js, and PostgreSQL.

## Overview

This platform enables organizations (nursing homes, restaurants, retail stores, etc.) to efficiently manage staff schedules, automate shift assignments, and handle leave requests. Each tenant operates in complete isolation with role-based access control (RBAC).

**Key Features:**
- Multi-tenant architecture with complete data isolation
- Role-based access control (Admin, Manager, Staff)
- Automated shift generation with configurable constraints
- Flexible shift patterns for various industries
- Leave request management
- Stripe subscription billing
- RESTful API with Swagger documentation
- Modern, responsive UI

## Tech Stack

### Backend
- **NestJS** - Scalable Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database
- **Redis** - Caching and session management
- **Passport + JWT** - Authentication and authorization
- **Stripe** - Payment and subscription management

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Zustand** - State management

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Domain Model

```
Tenant
├── User (Admin/Manager/Staff)
└── Facility
    ├── Staff
    ├── ShiftPattern
    ├── ShiftAssignment
    ├── ConstraintRule
    └── LeaveRequest
```

### Core Entities
- **Tenant**: Organization (nursing home, restaurant chain, etc.)
- **User**: System user with role-based permissions
- **Facility**: Physical location (branch, store, etc.)
- **Staff**: Employees who work shifts
- **ShiftPattern**: Reusable shift templates (early, day, night shifts)
- **ShiftAssignment**: Actual shift assignments for specific dates
- **ConstraintRule**: Rules for shift generation (max consecutive days, required skills)
- **LeaveRequest**: Staff leave/vacation requests

## Getting Started

### Requirements
- Node.js 18+
- Docker & Docker Compose
- (Optional) Stripe account for billing features

### Quick Start with Docker

The easiest way to run the entire platform:

```bash
# Clone the repository
git clone <repository-url>
cd shift-scheduler-v3-platform

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# Check logs
docker-compose logs -f
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Documentation**: http://localhost:3001/api/docs

### Local Development Setup

For development with hot-reload:

**1. Start Database Services**
```bash
# Start only PostgreSQL and Redis
npm run db:up
```

**2. Setup Backend**
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start backend in development mode
npm run dev
```

**3. Setup Frontend**
```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start frontend in development mode
npm run dev
```

**4. Run Everything**

From the project root:
```bash
# Run both backend and frontend concurrently
npm run dev
```

### Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shift_scheduler?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_...
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Demo Accounts

The seed data creates two sample tenants:

**Nursing Home** (介護施設)
- Email: `admin@sakura-care.com`
- Password: `password123`
- 10 staff members with nursing/care skills
- 4 shift patterns (early/day/late/night)

**Restaurant** (飲食店)
- Email: `manager@bella-vita.com`
- Password: `password123`
- 8 staff members (chefs and waitstaff)
- 3 shift patterns (lunch/dinner/all-day)

## Example Flow: Complete Staff CRUD

This is the **vertical slice** implementation - a fully working end-to-end flow.

### 1. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sakura-care.com","password":"password123"}'

# Response includes access_token
```

### 2. List Staff (GET /api/staff)
```bash
curl http://localhost:3001/api/staff \
  -H "Authorization: Bearer <token>"
```

Frontend: Navigate to `/staff` to see the list.

### 3. Get Staff Detail (GET /api/staff/:id)
```bash
curl http://localhost:3001/api/staff/<staff-id> \
  -H "Authorization: Bearer <token>"
```

### 4. Create Staff (POST /api/staff)
```bash
curl -X POST http://localhost:3001/api/staff \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新しいスタッフ",
    "facilityId": "<facility-id>",
    "employmentType": "FULL_TIME",
    "skills": ["介護福祉士"],
    "maxHoursPerWeek": 40
  }'
```

### 5. Update Staff (PATCH /api/staff/:id)
```bash
curl -X PATCH http://localhost:3001/api/staff/<staff-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"position": "主任"}'
```

### 6. Delete Staff (DELETE /api/staff/:id)
```bash
curl -X DELETE http://localhost:3001/api/staff/<staff-id> \
  -H "Authorization: Bearer <token>"
```

## Scripts Reference

### Root Commands
```bash
npm run dev          # Run backend + frontend concurrently
npm run build        # Build both apps
npm run start        # Start production builds
npm run test         # Run all tests
npm run lint         # Lint all code

npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:up        # Start PostgreSQL + Redis
npm run db:down      # Stop database services

npm run docker:up    # Start all services with Docker
npm run docker:down  # Stop all Docker services
npm run docker:build # Rebuild Docker images
```

### Backend Commands
```bash
cd backend
npm run dev          # Development with hot-reload
npm run build        # Build for production
npm run start        # Run production build
npm run test         # Run Jest tests
npm run lint         # Lint code

npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # Lint code
```

## Testing

Run tests:
```bash
# All tests
npm test

# Backend tests only
cd backend && npm test

# Watch mode
cd backend && npm run test:watch

# Coverage
cd backend && npm run test:cov
```

The test suite includes:
- **Unit tests**: Services and business logic
- **Integration tests**: Controller endpoints (todo)
- **Algorithm tests**: Shift scheduler engine

## API Documentation

Interactive API documentation is available via Swagger UI:

http://localhost:3001/api/docs

## Architecture Highlights

### Multi-Tenancy
- Every data model includes `tenantId`
- Middleware extracts tenant from JWT token
- All queries automatically scoped by tenant
- Complete data isolation between tenants

### Scheduler Engine
The shift generator is **interface-based** for easy extension:

```typescript
interface ISchedulerEngine {
  generate(input: ScheduleInput): Promise<ScheduleOutput>;
}
```

Current implementation: Heuristic algorithm
Future: OR-Tools, genetic algorithms, ML-based optimization

### Error Handling
- Global exception filter for consistent error responses
- Response interceptor for standardized success responses
- Validation with `class-validator` on all DTOs

## Project Structure

```
shift-scheduler-v3-platform/
├── backend/                      # NestJS backend
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.ts              # Sample data
│   ├── src/
│   │   ├── auth/                # Authentication
│   │   ├── common/              # Shared utilities
│   │   │   ├── filters/         # Exception filters
│   │   │   ├── interceptors/    # Response interceptor
│   │   │   ├── guards/          # RBAC guards
│   │   │   └── decorators/      # Custom decorators
│   │   ├── facility/            # Facility CRUD
│   │   ├── staff/               # Staff CRUD ⭐ Vertical slice
│   │   ├── shift-pattern/       # Shift patterns
│   │   ├── shift-assignment/    # Shift assignments
│   │   ├── scheduler/           # Auto-generation engine
│   │   ├── billing/             # Stripe integration
│   │   └── ...
│   ├── Dockerfile
│   └── jest.config.js
│
├── frontend/                    # Next.js frontend
│   ├── app/
│   │   ├── (dashboard)/         # Authenticated routes
│   │   │   ├── dashboard/       # Dashboard
│   │   │   ├── staff/           # Staff management ⭐
│   │   │   ├── patterns/        # Shift patterns
│   │   │   ├── schedule/        # Schedule view
│   │   │   └── ...
│   │   └── login/               # Login page
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── layout/              # Layout components
│   └── lib/
│       ├── api.ts               # API client
│       └── utils.ts
│
└── docker-compose.yml           # Full stack orchestration
```

## Future Extensions

### Phase 3 Enhancements
- [ ] Advanced scheduler with OR-Tools
- [ ] Real-time notifications (WebSocket)
- [ ] Mobile app (React Native)
- [ ] CSV import/export
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Email notifications (SendGrid)
- [ ] Audit logs
- [ ] API rate limiting per tenant
- [ ] Tenant branding customization

### Integrations
- [ ] Google Calendar sync
- [ ] Slack notifications
- [ ] Time tracking integration
- [ ] Payroll system export

## Migration from v2

If migrating from `welfare-shift-scheduler-core`:

1. **Data Migration**:
   - Export v2 data to JSON
   - Create Tenant for organization
   - Map facilities, staff, and shifts to new schema

2. **Algorithm Integration**:
   - Implement v2 algorithm as `ISchedulerEngine`
   - Place in `backend/src/scheduler/engines/`
   - Configure engine selection in settings

3. **Feature Parity**:
   - All v2 constraint rules are supported
   - Skill requirements mapped to new system
   - Historical data can be imported

## License

MIT

## Support

For issues or questions:
- GitHub Issues: [Open an issue](https://github.com/...)
- Documentation: Check `/api/docs` for API reference

---

**Built with ❤️ using NestJS, Next.js, and TypeScript**
