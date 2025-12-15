"""
Pytest configuration and shared fixtures for all tests.
"""

import pytest
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models.asset import Asset
from app.models.liability import Liability
from app.models.onboarding import OnboardingState


# Test database URL - using in-memory SQLite for fast tests
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def test_engine():
    """Create a test database engine with SQLite in-memory."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Enable foreign key constraints for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Drop all tables after test
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def test_db(test_engine) -> Generator[Session, None, None]:
    """Create a test database session."""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine
    )
    
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(test_db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with overridden database dependency."""
    
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


# ============================================================================
# Mock Data Factories
# ============================================================================

@pytest.fixture
def sample_asset_data():
    """Sample asset data for testing."""
    return {
        "name": "Chase Checking",
        "category": "cash_accounts",
        "value": 5000.00,
    }


@pytest.fixture
def sample_liability_data():
    """Sample liability data for testing."""
    return {
        "name": "Credit Card",
        "category": "credit_card",
        "balance": 1500.00,
    }


@pytest.fixture
def sample_onboarding_data():
    """Sample onboarding state data for testing."""
    return {
        "id": "test-onboarding",
        "current_step_id": "welcome",
        "household_type": None,
        "answers_json": "{}",
        "tasks_json": "[]",
        "completed_task_ids_json": "[]",
        "is_complete": False,
    }


@pytest.fixture
def create_asset(test_db: Session):
    """Factory fixture to create assets."""
    def _create_asset(**kwargs):
        import uuid
        defaults = {
            "id": str(uuid.uuid4()),
            "name": "Test Asset",
            "category": "cash_accounts",
            "value": 1000.00,
        }
        defaults.update(kwargs)
        
        asset = Asset(**defaults)
        test_db.add(asset)
        test_db.commit()
        test_db.refresh(asset)
        return asset
    
    return _create_asset


@pytest.fixture
def create_liability(test_db: Session):
    """Factory fixture to create liabilities."""
    def _create_liability(**kwargs):
        import uuid
        defaults = {
            "id": str(uuid.uuid4()),
            "name": "Test Liability",
            "category": "credit_card",
            "balance": 500.00,
        }
        defaults.update(kwargs)
        
        liability = Liability(**defaults)
        test_db.add(liability)
        test_db.commit()
        test_db.refresh(liability)
        return liability
    
    return _create_liability


@pytest.fixture
def create_onboarding_state(test_db: Session):
    """Factory fixture to create onboarding state."""
    def _create_onboarding(**kwargs):
        import uuid
        defaults = {
            "id": str(uuid.uuid4()),
            "current_step_id": "welcome",
            "household_type": None,
            "answers_json": "{}",
            "tasks_json": "[]",
            "completed_task_ids_json": "[]",
            "is_complete": False,
        }
        defaults.update(kwargs)
        
        state = OnboardingState(**defaults)
        test_db.add(state)
        test_db.commit()
        test_db.refresh(state)
        return state
    
    return _create_onboarding

