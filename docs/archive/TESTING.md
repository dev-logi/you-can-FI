# Testing Documentation

## Test Suite Overview

The You Can FI backend has comprehensive test coverage with **68 unit tests** achieving **88% code coverage**.

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures and test configuration
├── unit/                    # Unit tests (68 tests)
│   ├── test_repositories/   # Repository layer tests (41 tests)
│   │   ├── test_asset_repository.py
│   │   ├── test_liability_repository.py
│   │   └── test_onboarding_repository.py
│   └── test_services/       # Service layer tests (27 tests)
│       ├── test_net_worth_service.py
│       └── test_onboarding_service.py
└── integration/             # API endpoint tests (ready for local Postgres)
    ├── test_assets_api.py
    ├── test_liabilities_api.py
    ├── test_net_worth_api.py
    └── test_onboarding_api.py
```

## Running Tests

### All Unit Tests

```bash
pytest tests/unit/ -v
```

### With Coverage Report

```bash
pytest tests/unit/ --cov=app --cov-report=html
open htmlcov/index.html
```

### Specific Test File

```bash
pytest tests/unit/test_repositories/test_asset_repository.py -v
```

### Single Test

```bash
pytest tests/unit/test_services/test_net_worth_service.py::TestNetWorthService::test_calculate_empty -v
```

### Integration Tests (requires Postgres)

```bash
# Start local database first
docker compose up -d

# Run integration tests
pytest tests/integration/ -v
```

## Test Coverage Summary

| Module | Coverage | Notes |
|--------|----------|-------|
| Repositories | 95%+ | Excellent coverage of data access layer |
| Services | 93%+ | Business logic well tested |
| Models | 93%+ | SQLAlchemy models validated |
| Schemas | 100% | Pydantic schemas fully covered |
| API Routes | 51-62% | Covered by integration tests |

**Overall: 88% coverage**

## Test Categories

### Repository Tests (41 tests)

Tests CRUD operations and database queries:

- ✅ Asset CRUD operations
- ✅ Liability CRUD operations
- ✅ Onboarding state management
- ✅ Aggregation queries (totals, by category)
- ✅ Weighted calculations (interest rates)

### Service Tests (27 tests)

Tests business logic:

- ✅ Net worth calculations
- ✅ Category breakdowns with percentages
- ✅ Onboarding flow navigation
- ✅ Task generation and completion
- ✅ Progress tracking

### Integration Tests (Ready)

End-to-end API tests:

- ✅ Asset API endpoints
- ✅ Liability API endpoints
- ✅ Net worth summary endpoint
- ✅ Onboarding flow endpoints
- ✅ Complete workflows (create → update → delete)

## Test Fixtures

### Database Fixtures

- `test_engine` - In-memory SQLite database for fast tests
- `test_db` - Database session with automatic cleanup
- `client` - FastAPI TestClient with dependency overrides

### Factory Fixtures

- `create_asset(**kwargs)` - Create test assets
- `create_liability(**kwargs)` - Create test liabilities
- `create_onboarding_state(**kwargs)` - Create test onboarding state

### Sample Data Fixtures

- `sample_asset_data` - Valid asset data
- `sample_liability_data` - Valid liability data
- `sample_onboarding_data` - Valid onboarding data

## Example Test

```python
def test_calculate_net_worth(test_db, net_worth_service, create_asset, create_liability):
    """Test net worth calculation with assets and liabilities."""
    # Arrange
    create_asset(category="cash_accounts", value=10000.00)
    create_liability(category="credit_card", balance=5000.00)
    
    # Act
    summary = net_worth_service.calculate(test_db)
    
    # Assert
    assert summary.total_assets == 10000.00
    assert summary.total_liabilities == 5000.00
    assert summary.net_worth == 5000.00
```

## Continuous Integration

### Pre-commit Checks

```bash
# Run tests
pytest tests/unit/

# Check code quality
black app/ tests/
flake8 app/ tests/
mypy app/
```

### Coverage Requirements

- Minimum: 80% overall coverage
- Target: 90%+ for critical paths
- Current: 88% ✅

## Testing Best Practices

1. **Isolation**: Each test is independent with fresh database
2. **Fast**: Unit tests use in-memory SQLite (~1 second total)
3. **Comprehensive**: Test happy paths and error cases
4. **Readable**: Clear test names and arrange-act-assert pattern
5. **Maintainable**: Shared fixtures reduce duplication

## Next Steps

1. ✅ Unit tests complete (68 tests, 88% coverage)
2. ⏳ Integration tests ready (need local Postgres)
3. ⏳ Deploy to Supabase + Railway
4. ⏳ Run integration tests against production

## Troubleshooting

### Tests Fail with Database Error

```bash
# Check if test database is isolated
pytest tests/unit/ -v --tb=short

# Should use in-memory SQLite, not real Postgres
```

### Coverage Report Not Generated

```bash
# Install coverage dependencies
pip install pytest-cov

# Generate report
pytest --cov=app --cov-report=html
```

### Slow Tests

```bash
# Run only fast unit tests
pytest tests/unit/ -v

# Skip integration tests
pytest -m "not integration"
```

