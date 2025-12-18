-- Migration: Add liquidation statuses to equipment table
-- Date: 2025-11-03
-- Description: Adds 'preparing_liquidation' and 'pending_liquidation' statuses to equipment status enum

-- Step 1: Alter the enum to add new values
ALTER TABLE equipment
MODIFY COLUMN status ENUM(
  'active',
  'maintenance',
  'inactive',
  'preparing_liquidation',
  'pending_liquidation',
  'disposed'
) DEFAULT 'active';

-- Verify the change
SELECT COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'equipment'
AND COLUMN_NAME = 'status';
