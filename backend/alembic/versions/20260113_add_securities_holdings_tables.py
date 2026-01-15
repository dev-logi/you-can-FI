"""add securities and holdings tables for investment tracking

Revision ID: add_securities_holdings
Revises: add_transactions
Create Date: 2026-01-13 10:00:00.000000+00:00

Adds:
1. securities table - stores security info (stocks, funds, etc.) from Plaid
2. holdings table - stores user's holdings (quantity of each security per account)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_securities_holdings'
down_revision: Union[str, None] = 'add_transactions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check existing state
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Create securities table
    if 'securities' not in existing_tables:
        op.create_table('securities',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('plaid_security_id', sa.String(length=255), nullable=False),
            
            # Security details
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('ticker_symbol', sa.String(length=20), nullable=True),
            sa.Column('is_cash_equivalent', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('type', sa.String(length=50), nullable=True),
            
            # Price info
            sa.Column('close_price', sa.Float(), nullable=True),
            sa.Column('close_price_as_of', sa.Date(), nullable=True),
            sa.Column('iso_currency_code', sa.String(length=3), nullable=True),
            
            # Timestamps
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes for securities
        op.create_index('ix_securities_plaid_security_id', 'securities', ['plaid_security_id'], unique=True)
        op.create_index('ix_securities_ticker_symbol', 'securities', ['ticker_symbol'], unique=False)
    
    # Create holdings table
    if 'holdings' not in existing_tables:
        op.create_table('holdings',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('connected_account_id', sa.String(length=36), nullable=False),
            sa.Column('security_id', sa.String(length=36), nullable=False),
            
            # Holding details
            sa.Column('institution_price', sa.Float(), nullable=False, server_default='0'),
            sa.Column('institution_price_as_of', sa.Date(), nullable=True),
            sa.Column('institution_value', sa.Float(), nullable=False, server_default='0'),
            sa.Column('cost_basis', sa.Float(), nullable=True),
            sa.Column('quantity', sa.Float(), nullable=False, server_default='0'),
            sa.Column('iso_currency_code', sa.String(length=3), nullable=True),
            
            # Timestamps
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['connected_account_id'], ['connected_accounts.id'], ),
            sa.ForeignKeyConstraint(['security_id'], ['securities.id'], ),
        )
        
        # Create indexes for holdings
        op.create_index('ix_holdings_user_id', 'holdings', ['user_id'], unique=False)
        op.create_index('ix_holdings_connected_account_id', 'holdings', ['connected_account_id'], unique=False)
        op.create_index('ix_holdings_security_id', 'holdings', ['security_id'], unique=False)


def downgrade() -> None:
    # Drop holdings table indexes
    op.drop_index('ix_holdings_security_id', table_name='holdings')
    op.drop_index('ix_holdings_connected_account_id', table_name='holdings')
    op.drop_index('ix_holdings_user_id', table_name='holdings')
    
    # Drop holdings table
    op.drop_table('holdings')
    
    # Drop securities table indexes
    op.drop_index('ix_securities_ticker_symbol', table_name='securities')
    op.drop_index('ix_securities_plaid_security_id', table_name='securities')
    
    # Drop securities table
    op.drop_table('securities')
