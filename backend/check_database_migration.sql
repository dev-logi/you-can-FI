-- Database Migration Verification Script
-- Run this in Supabase SQL Editor to verify Plaid migration

-- ============================================
-- 1. Check connected_accounts table
-- ============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'connected_accounts'
        ) THEN '✅ connected_accounts table EXISTS'
        ELSE '❌ connected_accounts table DOES NOT EXIST'
    END as table_status;

-- Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'connected_accounts'
ORDER BY ordinal_position;

-- ============================================
-- 2. Check assets table for Plaid fields
-- ============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'assets' 
            AND column_name = 'connected_account_id'
        ) THEN '✅ Assets table has Plaid fields'
        ELSE '❌ Assets table MISSING Plaid fields'
    END as assets_status;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
  AND column_name IN ('connected_account_id', 'is_connected', 'last_synced_at')
ORDER BY column_name;

-- ============================================
-- 3. Check liabilities table for Plaid fields
-- ============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'liabilities' 
            AND column_name = 'connected_account_id'
        ) THEN '✅ Liabilities table has Plaid fields'
        ELSE '❌ Liabilities table MISSING Plaid fields'
    END as liabilities_status;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'liabilities' 
  AND column_name IN ('connected_account_id', 'is_connected', 'last_synced_at')
ORDER BY column_name;

-- ============================================
-- 4. Summary
-- ============================================
SELECT 
    (SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'connected_accounts'
    )) as has_connected_accounts_table,
    (SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'assets' 
        AND column_name = 'connected_account_id'
    )) as assets_has_plaid_fields,
    (SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'liabilities' 
        AND column_name = 'connected_account_id'
    )) as liabilities_has_plaid_fields;

