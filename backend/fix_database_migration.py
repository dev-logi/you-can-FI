#!/usr/bin/env python3
"""
Fix Database Migration Issue

This script fixes the is_connected column issue in the assets and liabilities tables.
It connects to Supabase using the DATABASE_URL and applies the necessary fixes.
"""

import os
import sys
from sqlalchemy import create_engine, text
from app.config import get_settings

def fix_database():
    """Fix the is_connected columns in assets and liabilities tables."""
    settings = get_settings()
    
    print("🔧 Fixing database migration issue...")
    print(f"📊 Connecting to database: {settings.database_url.split('@')[1] if '@' in settings.database_url else 'database'}")
    
    try:
        # Create engine
        engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
        )
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                print("\n1. Checking assets table...")
                # Check if column exists
                result = conn.execute(text("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'assets' 
                      AND column_name = 'is_connected'
                """))
                asset_col = result.fetchone()
                
                if asset_col:
                    print(f"   ✅ Column exists: {asset_col[0]} (nullable: {asset_col[2]}, default: {asset_col[3]})")
                    
                    # Check for NULL values
                    result = conn.execute(text("SELECT COUNT(*) FROM assets WHERE is_connected IS NULL"))
                    null_count = result.scalar()
                    print(f"   📊 NULL values found: {null_count}")
                    
                    if null_count > 0 or asset_col[3] is None:
                        print("   🔧 Fixing assets table...")
                        # Set default
                        conn.execute(text("ALTER TABLE assets ALTER COLUMN is_connected SET DEFAULT false"))
                        # Update NULLs
                        conn.execute(text("UPDATE assets SET is_connected = false WHERE is_connected IS NULL"))
                        print("   ✅ Assets table fixed")
                    else:
                        print("   ✅ Assets table already has default value")
                else:
                    print("   ⚠️  Column doesn't exist - adding it now...")
                    # Add columns with defaults
                    conn.execute(text("ALTER TABLE assets ADD COLUMN connected_account_id VARCHAR(36)"))
                    conn.execute(text("ALTER TABLE assets ADD COLUMN is_connected BOOLEAN NOT NULL DEFAULT false"))
                    conn.execute(text("ALTER TABLE assets ADD COLUMN last_synced_at TIMESTAMP"))
                    print("   ✅ Added columns to assets table")
                
                print("\n2. Checking liabilities table...")
                # Check if column exists
                result = conn.execute(text("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'liabilities' 
                      AND column_name = 'is_connected'
                """))
                liability_col = result.fetchone()
                
                if liability_col:
                    print(f"   ✅ Column exists: {liability_col[0]} (nullable: {liability_col[2]}, default: {liability_col[3]})")
                    
                    # Check for NULL values
                    result = conn.execute(text("SELECT COUNT(*) FROM liabilities WHERE is_connected IS NULL"))
                    null_count = result.scalar()
                    print(f"   📊 NULL values found: {null_count}")
                    
                    if null_count > 0 or liability_col[3] is None:
                        print("   🔧 Fixing liabilities table...")
                        # Set default
                        conn.execute(text("ALTER TABLE liabilities ALTER COLUMN is_connected SET DEFAULT false"))
                        # Update NULLs
                        conn.execute(text("UPDATE liabilities SET is_connected = false WHERE is_connected IS NULL"))
                        print("   ✅ Liabilities table fixed")
                    else:
                        print("   ✅ Liabilities table already has default value")
                else:
                    print("   ⚠️  Column doesn't exist - adding it now...")
                    # Add columns with defaults
                    conn.execute(text("ALTER TABLE liabilities ADD COLUMN connected_account_id VARCHAR(36)"))
                    conn.execute(text("ALTER TABLE liabilities ADD COLUMN is_connected BOOLEAN NOT NULL DEFAULT false"))
                    conn.execute(text("ALTER TABLE liabilities ADD COLUMN last_synced_at TIMESTAMP"))
                    print("   ✅ Added columns to liabilities table")
                
                # Commit transaction
                trans.commit()
                print("\n✅ Database fix completed successfully!")
                
                # Verify fix
                print("\n3. Verifying fix...")
                try:
                    result = conn.execute(text("""
                        SELECT table_name, column_name, column_default
                        FROM information_schema.columns 
                        WHERE table_name IN ('assets', 'liabilities')
                          AND column_name = 'is_connected'
                        ORDER BY table_name
                    """))
                    rows = result.fetchall()
                    if rows:
                        for row in rows:
                            print(f"   ✅ {row[0]}.{row[1]}: default = {row[2]}")
                        
                        result = conn.execute(text("SELECT COUNT(*) FROM assets WHERE is_connected IS NULL"))
                        asset_nulls = result.scalar()
                        result = conn.execute(text("SELECT COUNT(*) FROM liabilities WHERE is_connected IS NULL"))
                        liability_nulls = result.scalar()
                        
                        if asset_nulls == 0 and liability_nulls == 0:
                            print("   ✅ No NULL values found - fix successful!")
                        else:
                            print(f"   ⚠️  Warning: Still have NULL values (assets: {asset_nulls}, liabilities: {liability_nulls})")
                    else:
                        print("   ⚠️  Columns still don't exist - check for errors above")
                except Exception as e:
                    print(f"   ⚠️  Could not verify (columns may not exist): {e}")
                
            except Exception as e:
                trans.rollback()
                print(f"\n❌ Error during fix: {e}")
                raise
        
    except Exception as e:
        print(f"\n❌ Failed to connect to database: {e}")
        print("\n💡 Make sure DATABASE_URL is set correctly in your environment.")
        sys.exit(1)

if __name__ == "__main__":
    fix_database()

