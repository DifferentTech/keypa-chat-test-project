# Home Maintenance Agent

An AI-powered home maintenance assistant built with **VoltAgent**, **CopilotKit**, and **Next.js**. This application helps homeowners with maintenance advice, cost estimates, and scheduling professional services with admin approval workflow.

## Features

### AI Chat Assistant
- **Maintenance Tips**: Get practical advice for common home issues (leaky faucets, clogged drains, HVAC, electrical, roofing)
- **Cost Estimates**: Receive rough cost estimates for DIY vs professional repairs with regional adjustments
- **Professional Scheduling**: Request professional services (plumbing, electrical, HVAC, general) with admin approval

### Admin Dashboard
- View all service requests with filtering by status
- Approve requests by assigning professionals, date, and time slot
- Reject requests with notes
- Real-time status tracking

### Real-Time Status Updates
- Polling-based status alerts in chat
- Automatic UI updates when admin approves/rejects requests
- Shows appointment details upon approval

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **AI Framework**: VoltAgent (agent framework), CopilotKit (chat UI)
- **LLM**: OpenAI GPT-4o
- **Database**: LibSQL/Turso (SQLite-compatible)
- **Server**: Hono (via VoltAgent)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  VoltAgent API   │────▶│   OpenAI API    │
│   (Port 3000)   │     │   (Port 3141)    │     │    (GPT-4o)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Admin Dashboard│     │   Turso/LibSQL   │
│   /admin        │     │   (Database)     │
└─────────────────┘     └──────────────────┘
```

## Project Structure

```
src/
├── app/                          # Next.js app router
│   ├── page.tsx                  # Main chat page
│   ├── admin/page.tsx            # Admin dashboard
│   └── api/
│       ├── requests/[id]/        # User-facing status API
│       └── admin/requests/       # Admin APIs (list, approve, reject)
├── components/
│   ├── chat/
│   │   ├── copilot-chat.tsx      # CopilotKit chat integration
│   │   └── request-status-alert.tsx  # Polling status component
│   └── admin/
│       ├── admin-dashboard.tsx   # Admin dashboard component
│       └── service-request-card.tsx  # Request card component
├── tools/
│   ├── schedule-professional.ts  # Schedule service tool
│   ├── estimate-cost.ts          # Cost estimation tool
│   └── get-maintenance-tips.ts   # Maintenance tips tool
├── workflows/
│   └── service-request-workflow.ts  # Workflow definition
├── lib/
│   ├── config.ts                 # Environment configuration
│   ├── professionals.ts          # Professional providers data
│   ├── memory.ts                 # VoltAgent memory setup
│   └── db/
│       └── service-requests.ts   # Database operations
└── server.ts                     # VoltAgent server entry point
```

## Agent Tools

| Tool | Description |
|------|-------------|
| `get_maintenance_tips` | Provides practical maintenance tips for common home issues |
| `estimate_cost` | Calculates DIY vs professional cost estimates with regional adjustments |
| `schedule_professional` | Creates service requests for admin approval |
| `check_request_status` | Checks the status of user's service requests |

## Available Professionals

| Category | Providers |
|----------|-----------|
| Plumbing | QuickFix Plumbing, ProPipe Services |
| Electrical | SafeWire Electric, Spark Masters |
| HVAC | CoolAir HVAC, Climate Control Pro |
| General | HandyPro Services, HomeFixers Plus |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key
- Turso database (or local LibSQL)

### Environment Setup

Create a `.env.local` file:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Turso Database
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Optional: CopilotKit URL (defaults to localhost:3141)
NEXT_PUBLIC_COPILOTKIT_URL=http://localhost:3141/copilotkit
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development servers (Next.js + VoltAgent)
pnpm dev
```

This starts:
- **Next.js**: http://localhost:3000
- **VoltAgent API**: http://localhost:3141
- **Swagger UI**: http://localhost:3141/ui

### Individual Commands

```bash
# Run only Next.js
pnpm dev:next

# Run only VoltAgent server
pnpm dev:agent

# Build for production
pnpm build

# Start production
pnpm start
```

## Usage

### User Chat Flow

1. Open http://localhost:3000
2. Choose a conversation starter or type your question
3. Ask about maintenance issues, cost estimates, or request a professional
4. When requesting a professional, provide:
   - Service type (plumbing, electrical, HVAC, general)
   - Issue description
   - Urgency level
   - Preferred date/time (optional)
5. Request is submitted and shows pending status
6. Status alert polls for updates automatically

### Admin Workflow

1. Open http://localhost:3000/admin
2. View pending service requests
3. Click "Approve" to:
   - Select a professional
   - Set appointment date and time slot
   - Add optional notes
4. Or click "Reject" with a reason
5. User's chat automatically updates with the decision

## API Endpoints

### User APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/requests/[id]` | Get request status (for polling) |

### Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/requests` | List all requests (with filters) |
| GET | `/api/admin/requests/[id]` | Get single request |
| POST | `/api/admin/requests/[id]/approve` | Approve request |
| POST | `/api/admin/requests/[id]/reject` | Reject request |

### VoltAgent APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/copilotkit` | CopilotKit runtime endpoint |
| GET | `/health` | Health check |
| GET | `/ui` | Swagger UI |

## Database Schema

```sql
CREATE TABLE service_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  conversation_id TEXT,
  property_id TEXT NOT NULL,
  property_address TEXT NOT NULL,
  service_type TEXT NOT NULL,
  issue TEXT NOT NULL,
  urgency TEXT NOT NULL,
  preferred_date TEXT,
  preferred_time_slot TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  workflow_run_id TEXT,
  assigned_professional_id TEXT,
  assigned_professional_name TEXT,
  confirmed_date TEXT,
  confirmed_time_slot TEXT,
  admin_notes TEXT,
  processed_by TEXT,
  processed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Request Statuses

| Status | Description |
|--------|-------------|
| `pending` | Awaiting admin approval |
| `approved` | Approved with assigned professional |
| `rejected` | Rejected by admin |
| `completed` | Service completed |
| `cancelled` | Cancelled by user |

## Configuration

The application uses `src/lib/config.ts` for centralized configuration:

```typescript
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  turso: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};
```

## License

MIT
