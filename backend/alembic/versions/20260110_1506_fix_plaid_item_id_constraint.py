"""fix plaid_item_id unique constraint - allow multiple accounts per item

Revision ID: fix_plaid_item_id
Revises: 287c26651cd8
Create Date: 2026-01-10 15:06:00.000000+00:00

The plaid_item_id should NOT be unique because:
- One plaid_item_id = one bank connection (one Plaid Link session)
- One bank connection can have MULTIPLE accounts (checking, savings, etc.)
- So multiple records should share the same plaid_item_id

This migration:
1. Drops the unique index on plaid_item_id
2. Creates a non-unique index on plaid_item_id (for query performance)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_plaid_item_id'
down_revision: Union[str, None] = '287c26651cd8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the unique index on plaid_item_id
    op.drop_index('ix_connected_accounts_plaid_item_id', table_name='connected_accounts')
    
    # Create a non-unique index on plaid_item_id (for query performance)
    op.create_index(
        'ix_connected_accounts_plaid_item_id', 
        'connected_accounts', 
        ['plaid_item_id'], 
        unique=False
    )


def downgrade() -> None:
    # Drop the non-unique index
    op.drop_index('ix_connected_accounts_plaid_item_id', table_name='connected_accounts')
    
    # Recreate the unique index (this may fail if duplicates exist)
    op.create_index(
        'ix_connected_accounts_plaid_item_id', 
        'connected_accounts', 
        ['plaid_item_id'], 
        unique=True
    )
