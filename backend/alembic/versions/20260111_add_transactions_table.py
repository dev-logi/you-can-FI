"""add transactions table and transactions_cursor to connected_accounts

Revision ID: add_transactions
Revises: fix_plaid_item_id
Create Date: 2026-01-11 04:30:00.000000+00:00

Adds:
1. transactions table - stores transaction data synced from Plaid
2. transactions_cursor column on connected_accounts - for incremental sync
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_transactions'
down_revision: Union[str, None] = 'fix_plaid_item_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check existing state
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Create transactions table
    if 'transactions' not in existing_tables:
        op.create_table('transactions',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('connected_account_id', sa.String(length=36), nullable=False),
            
            # Plaid identifiers
            sa.Column('plaid_transaction_id', sa.String(length=255), nullable=False),
            sa.Column('plaid_account_id', sa.String(length=255), nullable=False),
            
            # Transaction details
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('iso_currency_code', sa.String(length=3), nullable=True),
            
            # Dates
            sa.Column('date', sa.Date(), nullable=False),
            sa.Column('authorized_date', sa.Date(), nullable=True),
            
            # Merchant info
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('merchant_name', sa.String(length=255), nullable=True),
            
            # Categories
            sa.Column('category_primary', sa.String(length=100), nullable=True),
            sa.Column('category_detailed', sa.String(length=100), nullable=True),
            
            # Payment info
            sa.Column('payment_channel', sa.String(length=50), nullable=True),
            sa.Column('pending', sa.Boolean(), nullable=False, server_default='false'),
            
            # Location
            sa.Column('location_city', sa.String(length=100), nullable=True),
            sa.Column('location_region', sa.String(length=50), nullable=True),
            sa.Column('location_country', sa.String(length=50), nullable=True),
            
            # User customization
            sa.Column('user_category', sa.String(length=100), nullable=True),
            sa.Column('user_notes', sa.Text(), nullable=True),
            sa.Column('is_hidden', sa.Boolean(), nullable=False, server_default='false'),
            
            # Timestamps
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes
        op.create_index('ix_transactions_user_id', 'transactions', ['user_id'], unique=False)
        op.create_index('ix_transactions_connected_account_id', 'transactions', ['connected_account_id'], unique=False)
        op.create_index('ix_transactions_plaid_transaction_id', 'transactions', ['plaid_transaction_id'], unique=True)
        op.create_index('ix_transactions_plaid_account_id', 'transactions', ['plaid_account_id'], unique=False)
        op.create_index('ix_transactions_date', 'transactions', ['date'], unique=False)
        op.create_index('ix_transactions_category_primary', 'transactions', ['category_primary'], unique=False)
    
    # Add transactions_cursor to connected_accounts
    connected_accounts_columns = [col['name'] for col in inspector.get_columns('connected_accounts')] if 'connected_accounts' in existing_tables else []
    
    if 'transactions_cursor' not in connected_accounts_columns:
        op.add_column('connected_accounts', sa.Column('transactions_cursor', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove transactions_cursor from connected_accounts
    op.drop_column('connected_accounts', 'transactions_cursor')
    
    # Drop transactions table indexes
    op.drop_index('ix_transactions_category_primary', table_name='transactions')
    op.drop_index('ix_transactions_date', table_name='transactions')
    op.drop_index('ix_transactions_plaid_account_id', table_name='transactions')
    op.drop_index('ix_transactions_plaid_transaction_id', table_name='transactions')
    op.drop_index('ix_transactions_connected_account_id', table_name='transactions')
    op.drop_index('ix_transactions_user_id', table_name='transactions')
    
    # Drop transactions table
    op.drop_table('transactions')
