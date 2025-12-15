# You Can FI 💰

A private, family-use personal finance mobile app that helps you track your **Net Worth**, **Budgets & Spending** (coming soon), and measure your path to **Financial Independence** (coming soon).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App (Expo)                   │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────────────────┐ │
│  │   UI    │→ │ Stores  │→ │ API Client                   │ │
│  └─────────┘  └─────────┘  └──────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 Python Backend (Railway)                     │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐ │
│  │ FastAPI  │→ │ Services  │→ │ Repos      │→ │SQLAlchemy│ │
│  └──────────┘  └───────────┘  └────────────┘  └──────────┘ │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  PostgreSQL           │
                    │  (Supabase / Railway) │
                    └───────────────────────┘
```

## Features

### Phase 1 (Complete) ✅
- **TurboTax-style Onboarding**: Guided flow to discover your assets and liabilities
- **Net Worth Tracking**: Track total assets, liabilities, and net worth
- **Category Breakdown**: Organize by asset/liability type
- **Python Backend**: FastAPI with SQLAlchemy
- **Resume Capability**: Onboarding state persists

### Phase 2 (Coming Soon) 📊
- Transaction tracking
- Monthly budgets
- Spending categories
- Savings rate calculation

### Phase 3 (Coming Soon) 🎯
- FI/FIRE number calculation
- Progress tracking
- Coast FI
- Scenario planning

## Tech Stack

### Mobile App
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: Zustand
- **UI**: Tamagui

### Backend
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL (Supabase free tier)
- **Hosting**: Railway

## Project Structure

```
you-can-FI/
├── app/                          # Expo Router screens
│   ├── (onboarding)/             # Onboarding flow
│   └── (main)/                   # Main app screens
├── src/
│   ├── api/                      # API client & services
│   │   ├── client.ts             # HTTP client
│   │   ├── config.ts             # API URL config
│   │   └── services/             # API service wrappers
│   ├── features/
│   │   ├── onboarding/           # Onboarding store & engine
│   │   ├── netWorth/             # Net worth store
│   │   ├── budget/               # Phase 2 stub
│   │   └── financialIndependence/ # Phase 3 stub
│   └── shared/
│       ├── components/           # Reusable UI
│       ├── hooks/                # Custom hooks
│       ├── utils/                # Helpers
│       └── types/                # TypeScript types
├── backend/                      # Python backend
│   ├── app/
│   │   ├── main.py               # FastAPI entry
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── repositories/         # Data access
│   │   ├── services/             # Business logic
│   │   └── api/                  # Route handlers
│   ├── Dockerfile
│   └── requirements.txt
└── tamagui.config.ts             # Theme configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account (free tier)
- Railway account (for deployment)

### 1. Setup Supabase

1. Create a project at https://supabase.com
2. Go to Settings > Database > Connection string
3. Copy the URI for the next step

### 2. Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variable
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Run the server
uvicorn app.main:app --reload
```

API will be at http://localhost:8000 (docs at /docs)

### 3. Start the Mobile App

```bash
# In a new terminal, from project root
npm install
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

### 4. Deploy to Railway

```bash
cd backend

# Install Railway CLI
npm install -g @railway/cli
railway login

# Create project and deploy
railway init
railway up
```

Add `DATABASE_URL` environment variable in Railway dashboard.

## API Endpoints

### Assets
- `POST /api/v1/assets` - Create asset
- `GET /api/v1/assets` - List assets
- `PUT /api/v1/assets/{id}` - Update asset
- `DELETE /api/v1/assets/{id}` - Delete asset

### Liabilities
- `POST /api/v1/liabilities` - Create liability
- `GET /api/v1/liabilities` - List liabilities
- `PUT /api/v1/liabilities/{id}` - Update liability
- `DELETE /api/v1/liabilities/{id}` - Delete liability

### Net Worth
- `GET /api/v1/net-worth` - Get net worth summary

### Onboarding
- `GET /api/v1/onboarding` - Get/create onboarding state
- `POST /api/v1/onboarding/answer` - Answer question
- `POST /api/v1/onboarding/task/complete` - Complete task
- `POST /api/v1/onboarding/complete` - Finish onboarding

## Switching Database

The app uses Supabase PostgreSQL by default (free tier). To switch to Railway PostgreSQL:

1. Add PostgreSQL in Railway dashboard
2. Copy the connection string
3. Update `DATABASE_URL` environment variable
4. Redeploy - **no code changes needed!**

## Design Philosophy

- **Trustworthy**: Deep navy blues, clean typography
- **Calm**: Soft cream backgrounds, muted accents
- **Insightful**: Clear data visualization
- **Mobile-first**: Optimized for touch and small screens

## License

MIT

---

Built with ❤️ for personal financial freedom.
