-- Check if the migration columns exist and their constraints
-- Run this to diagnose database schema issues

-- Check assets table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
  AND column_name IN ('is_connected', 'connected_account_id', 'last_synced_at')
ORDER BY column_name;

-- Check liabilities table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'liabilities' 
  AND column_name IN ('is_connected', 'connected_account_id', 'last_synced_at')
ORDER BY column_name;

-- Check if there are any NULL values in is_connected (shouldn't happen)
SELECT COUNT(*) as null_is_connected_count
FROM assets 
WHERE is_connected IS NULL;

SELECT COUNT(*) as null_is_connected_count
FROM liabilities 
WHERE is_connected IS NULL;

-- Check if connected_accounts table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'connected_accounts'
) as connected_accounts_exists;

