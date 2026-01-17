"""add multi-aggregator support to connected_accounts

Revision ID: add_multi_aggregator
Revises: add_securities_holdings
Create Date: 2026-01-17 10:00:00.000000+00:00

Adds provider-agnostic fields to connected_accounts table to support
multiple aggregator providers (Plaid, Finicity, Yodlee, MX, etc.):

1. provider - Identifies which aggregator this account is from
2. provider_item_id - Provider's connection/item ID (replaces plaid_item_id)
3. provider_access_token - Encrypted access token (replaces plaid_access_token)
4. provider_account_id - Provider's account ID (replaces plaid_account_id)
5. institution_id - Provider's institution ID
6. account_mask - Last 4 digits of account number
7. sync_cursor - Generic sync cursor (replaces transactions_cursor)

The legacy plaid_* fields are kept for backward compatibility and will be
migrated to the new provider_* fields. The migration copies existing data
from plaid_* to provider_* fields.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_multi_aggregator'
down_revision: Union[str, None] = 'add_securities_holdings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check existing state
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    if 'connected_accounts' not in existing_tables:
        print("[Migration] connected_accounts table does not exist, skipping")
        return
    
    # Get existing columns
    existing_columns = [col['name'] for col in inspector.get_columns('connected_accounts')]
    
    # Add new provider-agnostic columns
    
    # 1. provider (default to 'plaid' for existing rows)
    if 'provider' not in existing_columns:
        op.add_column('connected_accounts', 
            sa.Column('provider', sa.String(50), nullable=False, server_default='plaid')
        )
        print("[Migration] Added 'provider' column")
    
    # 2. provider_item_id
    if 'provider_item_id' not in existing_columns:
        op.add_column('connected_accounts',
            sa.Column('provider_item_id', sa.String(255), nullable=True)
        )
        # Copy data from plaid_item_id
        op.execute("UPDATE connected_accounts SET provider_item_id = plaid_item_id WHERE plaid_item_id IS NOT NULL")
        # Make it not-null after copying data
        op.alter_column('connected_accounts', 'provider_item_id', nullable=False, server_default=None)
        # Create index
        op.create_index('ix_connected_accounts_provider_item_id', 'connected_accounts', ['provider_item_id'])
        print("[Migration] Added 'provider_item_id' column and migrated data")
    
    # 3. provider_access_token
    if 'provider_access_token' not in existing_columns:
        op.add_column('connected_accounts',
            sa.Column('provider_access_token', sa.Text(), nullable=True)
        )
        # Copy data from plaid_access_token
        op.execute("UPDATE connected_accounts SET provider_access_token = plaid_access_token WHERE plaid_access_token IS NOT NULL")
        # Make it not-null after copying data
        op.alter_column('connected_accounts', 'provider_access_token', nullable=False, server_default=None)
        print("[Migration] Added 'provider_access_token' column and migrated data")
    
    # 4. provider_account_id
    if 'provider_account_id' not in existing_columns:
        op.add_column('connected_accounts',
            sa.Column('provider_account_id', sa.String(255), nullable=True)
        )
        # Copy data from plaid_account_id
        op.execute("UPDATE connected_accounts SET provider_account_id = plaid_account_id WHERE plaid_account_id IS NOT NULL")
        # Make it not-null after copying data
        op.alter_column('connected_accounts', 'provider_account_id', nullable=False, server_default=None)
        # Create index
        op.create_index('ix_connected_accounts_provider_account_id', 'connected_accounts', ['provider_account_id'])
        print("[Migration] Added 'provider_account_id' column and migrated data")
    
    # 5. institution_id
    if 'institution_id' not in existing_columns:
        op.add_column('connected_accounts',
            sa.Column('institution_id', sa.String(255), nullable=True)
        )
        print("[Migration] Added 'institution_id' column")
    
    # 6. account_mask
    if 'account_mask' not in existing_columns:
        op.add_column('connected_accounts',
            sa.Column('account_mask', sa.String(10), nullable=True)
        )
        print("[Migration] Added 'account_mask' column")
    
    # 7. sync_cursor (generic cursor for any provider)
    if 'sync_cursor' not in existing_columns:
        op.add_column('connected_accounts',
            sa.Column('sync_cursor', sa.Text(), nullable=True)
        )
        # Copy data from transactions_cursor
        if 'transactions_cursor' in existing_columns:
            op.execute("UPDATE connected_accounts SET sync_cursor = transactions_cursor WHERE transactions_cursor IS NOT NULL")
        print("[Migration] Added 'sync_cursor' column and migrated data")
    
    # Create index on provider column for efficient filtering
    try:
        op.create_index('ix_connected_accounts_provider', 'connected_accounts', ['provider'])
        print("[Migration] Created index on 'provider' column")
    except Exception as e:
        print(f"[Migration] Index on 'provider' may already exist: {e}")
    
    # Make legacy plaid_* columns nullable (they're now deprecated)
    # This allows new non-Plaid accounts to be created without these fields
    try:
        if 'plaid_item_id' in existing_columns:
            op.alter_column('connected_accounts', 'plaid_item_id', nullable=True)
        if 'plaid_access_token' in existing_columns:
            op.alter_column('connected_accounts', 'plaid_access_token', nullable=True)
        if 'plaid_account_id' in existing_columns:
            op.alter_column('connected_accounts', 'plaid_account_id', nullable=True)
        print("[Migration] Made legacy plaid_* columns nullable")
    except Exception as e:
        print(f"[Migration] Could not alter legacy columns: {e}")


def downgrade() -> None:
    # Check existing state
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    if 'connected_accounts' not in existing_tables:
        return
    
    existing_columns = [col['name'] for col in inspector.get_columns('connected_accounts')]
    
    # Drop indexes first
    try:
        op.drop_index('ix_connected_accounts_provider', table_name='connected_accounts')
    except:
        pass
    try:
        op.drop_index('ix_connected_accounts_provider_item_id', table_name='connected_accounts')
    except:
        pass
    try:
        op.drop_index('ix_connected_accounts_provider_account_id', table_name='connected_accounts')
    except:
        pass
    
    # Drop new columns
    if 'sync_cursor' in existing_columns:
        op.drop_column('connected_accounts', 'sync_cursor')
    if 'account_mask' in existing_columns:
        op.drop_column('connected_accounts', 'account_mask')
    if 'institution_id' in existing_columns:
        op.drop_column('connected_accounts', 'institution_id')
    if 'provider_account_id' in existing_columns:
        op.drop_column('connected_accounts', 'provider_account_id')
    if 'provider_access_token' in existing_columns:
        op.drop_column('connected_accounts', 'provider_access_token')
    if 'provider_item_id' in existing_columns:
        op.drop_column('connected_accounts', 'provider_item_id')
    if 'provider' in existing_columns:
        op.drop_column('connected_accounts', 'provider')
    
    # Make legacy columns not-null again
    try:
        op.alter_column('connected_accounts', 'plaid_item_id', nullable=False)
        op.alter_column('connected_accounts', 'plaid_access_token', nullable=False)
        op.alter_column('connected_accounts', 'plaid_account_id', nullable=False)
    except:
        pass
