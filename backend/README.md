# You Can FI - Backend API

FastAPI backend for the You Can FI personal finance mobile app.

## Features

- **Net Worth Tracking**: Calculate assets, liabilities, and net worth
- **Onboarding Flow**: TurboTax-style question-based onboarding
- **PostgreSQL**: Works with Supabase (free tier) or Railway Postgres
- **Type-Safe**: Full type safety with Pydantic models
- **Tested**: Comprehensive unit and integration tests

## Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Psycopg3** - PostgreSQL adapter
- **Pydantic** - Data validation
- **Alembic** - Database migrations
- **Pytest** - Testing framework

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API route handlers
│   ├── models/              # SQLAlchemy models
│   ├── repositories/        # Data access layer
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── config.py            # Settings
│   ├── database.py          # DB setup
│   └── main.py              # FastAPI app
├── tests/
│   ├── unit/                # Unit tests
│   └── integration/         # API integration tests
├── alembic/                 # Database migrations
├── docker-compose.yml       # Local Postgres
├── Dockerfile               # Railway deployment
└── requirements.txt         # Dependencies
```

## Local Development

### 1. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 2. Start Local Database

```bash
# Start PostgreSQL with Docker
docker compose up -d

# Verify it's running
docker compose ps
```

### 3. Run Migrations

```bash
# Apply migrations
alembic upgrade head

# Create new migration (after model changes)
alembic revision --autogenerate -m "Description"
```

### 4. Run the Server

```bash
# Development mode (auto-reload)
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing

### Run All Tests

```bash
# Run all tests with coverage
pytest

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/unit/test_repositories/test_asset_repository.py
```

### Coverage Report

```bash
# Generate HTML coverage report
pytest --cov=app --cov-report=html

# Open report
open htmlcov/index.html
```

## API Endpoints

### Assets
- `POST /api/v1/assets/` - Create asset
- `GET /api/v1/assets/` - List all assets
- `GET /api/v1/assets/{id}` - Get asset by ID
- `PUT /api/v1/assets/{id}` - Update asset
- `DELETE /api/v1/assets/{id}` - Delete asset

### Liabilities
- `POST /api/v1/liabilities/` - Create liability
- `GET /api/v1/liabilities/` - List all liabilities
- `GET /api/v1/liabilities/{id}` - Get liability by ID
- `PUT /api/v1/liabilities/{id}` - Update liability
- `DELETE /api/v1/liabilities/{id}` - Delete liability

### Net Worth
- `GET /api/v1/net-worth/` - Get net worth summary

### Onboarding
- `GET /api/v1/onboarding/` - Get or create onboarding state
- `POST /api/v1/onboarding/answer` - Answer question
- `POST /api/v1/onboarding/task/complete` - Complete task
- `POST /api/v1/onboarding/complete` - Mark onboarding complete
- `DELETE /api/v1/onboarding/reset` - Reset onboarding

## Database Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current

# Show history
alembic history
```

## Deployment

### Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Copy the database connection string from Settings → Database
3. Set as `DATABASE_URL` environment variable

### Railway Deployment

1. Connect to GitHub repository
2. Set environment variables:
   ```
   DATABASE_URL=your_supabase_connection_string
   DEBUG=False
   ```
3. Deploy!

Railway will automatically:
- Build using the Dockerfile
- Run on port specified by `$PORT` (auto-configured)
- Health check at `/health` endpoint

### Environment Variables

Create `.env` file (not committed to git):

```env
# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/youcanfi
DEBUG=True
CORS_ORIGINS=["*"]

# Production (Supabase)
# DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
# DEBUG=False
# CORS_ORIGINS=["https://youcanfi.app"]
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if Postgres is running
docker compose ps

# View logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

### Migration Issues

```bash
# Reset migrations (CAUTION: drops all data)
docker compose down -v
docker compose up -d
alembic upgrade head
```

### Test Failures

```bash
# Run tests with detailed output
pytest -vv --tb=short

# Run single test
pytest tests/unit/test_services/test_net_worth_service.py::TestNetWorthService::test_calculate_empty -vv
```

## Code Quality

```bash
# Format code with Black
black app/ tests/

# Lint with Flake8
flake8 app/ tests/

# Type check with MyPy
mypy app/
```

## License

MIT
