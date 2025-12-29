-- Fix migration: Add default values for is_connected columns
-- This should be run if the migration failed or if existing data needs defaults

-- For assets table
ALTER TABLE assets 
  ALTER COLUMN is_connected SET DEFAULT false;

-- Update existing rows that might have NULL values
UPDATE assets 
  SET is_connected = false 
  WHERE is_connected IS NULL;

-- For liabilities table
ALTER TABLE liabilities 
  ALTER COLUMN is_connected SET DEFAULT false;

-- Update existing rows that might have NULL values
UPDATE liabilities 
  SET is_connected = false 
  WHERE is_connected IS NULL;

