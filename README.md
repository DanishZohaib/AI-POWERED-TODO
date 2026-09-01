# AI-Powered Todo & Workflow Management System

A corporate-grade, category-driven workflow and task tracking system with custom completion stages, team-wide visibility, role-based access control, and real-time dashboards.

## 🏗️ Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Frontend          │     │   Backend           │     │   Database          │
│   Next.js 16        │◄───►│   FastAPI            │◄───►│   Neon PostgreSQL   │
│   TypeScript        │     │   Python 3.12+       │     │   (Serverless)      │
│   Tailwind CSS      │     │   SQLAlchemy (async)  │     │                     │
│   shadcn/ui         │     │   Pydantic           │     │                     │
│   Recharts          │     │   bcrypt + JWT       │     │                     │
│   Framer Motion     │     │   Alembic            │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
        │                           │
    Vercel                   Python Hosting
```

## 📋 Features

- **Role-Based Access Control** — Power Admin & Standard User roles
- **Custom Workflow Categories** — Admin-defined stages per category
- **Task Management** — Create, delegate, track, and complete tasks
- **Workflow Stage Processing** — Sequential stage completion with progress tracking
- **Team-Wide Visibility** — Shared task workspace with permission-based editing
- **Interactive Dashboard** — Real-time KPIs, charts, and period filtering
- **Password Expiry System** — Configurable expiry with warnings
- **Excel Export** — Multi-sheet reports with full audit history
- **In-App Notifications** — Task delegation, due dates, and password expiry
- **Complete Audit Trail** — Immutable record of all system events
- **Dark/Light Mode** — Theme toggle with persistent preference
- **Mobile-First Design** — Responsive across all device sizes

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.9+ and npm
- **Python** 3.12+
- **Neon PostgreSQL** account ([console.neon.tech](https://console.neon.tech))

### 1. Clone & Configure

```bash
git clone <repo-url>
cd AI-POWERED-TODO

# Copy environment template
cp .env.example .env
# Edit .env with your Neon connection string and secrets
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed development data
python -m app.db.seed

# Start development server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs** (dev only): http://localhost:8000/docs

### 5. Default Login

| User ID | Password | Role |
|---------|----------|------|
| ADMIN001 | (from SEED_ADMIN_PASSWORD env) | Power Admin |
| USER001–USER005 | User@12345 | Standard User |

## 🔧 Environment Variables

See [.env.example](.env.example) for all configuration options.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Async PostgreSQL connection string |
| `DATABASE_URL_SYNC` | ✅ | Sync PostgreSQL connection string (for Alembic) |
| `SECRET_KEY` | ✅ | JWT signing key (min 32 characters) |
| `CORS_ORIGINS` | ✅ | Allowed frontend origins |
| `SEED_ADMIN_PASSWORD` | Dev only | Initial admin password |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL for frontend |

## 🗄️ Database

### Neon Setup

1. Create a free account at [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file
4. For `DATABASE_URL`, use `postgresql+asyncpg://...`
5. For `DATABASE_URL_SYNC`, use `postgresql://...`

### Migrations

```bash
cd backend

# Generate a new migration after model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Schema

9 tables: `teams`, `users`, `categories`, `category_stages`, `tasks`, `task_stages`, `task_delegations`, `audit_logs`, `notifications`

## 📁 Project Structure

```
AI-POWERED-TODO/
├── frontend/          # Next.js 16 application
│   ├── app/           # App Router pages
│   ├── components/    # UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities
│   ├── services/      # API service functions
│   └── types/         # TypeScript interfaces
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # REST API endpoints
│   │   ├── core/      # Config, security, exceptions
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── repositories/ # Database queries
│   ├── alembic/       # Database migrations
│   └── tests/         # Backend tests
├── .env.example       # Environment template
└── README.md
```

## 🔒 Security

- Passwords hashed with **bcrypt** (never stored as plain text)
- JWT tokens in **HTTP-only cookies**
- Backend-enforced **RBAC** (not frontend-only)
- Input validation on both frontend and backend
- SQL injection prevention via SQLAlchemy ORM
- CORS configuration
- No secrets in source code

## 🧪 Testing

```bash
cd backend
python -m pytest tests/ -v
```

## 📦 Deployment

### Frontend → Vercel

1. Connect your repository to Vercel
2. Set root directory to `frontend`
3. Add environment variables
4. Deploy

### Backend → Railway / Render / Fly.io

1. Set root directory to `backend`
2. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables
4. Deploy

### Database → Neon

Already configured as serverless — no deployment needed.

## 📝 License

Private — Corporate Use Only
