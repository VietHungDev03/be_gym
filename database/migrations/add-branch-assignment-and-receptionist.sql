-- Migration: Add branch assignment and receptionist features
-- Purpose: Add assigned_branch_id to users table and escalation fields to incidents table
-- Date: 2025-12-06

USE igymcare;

-- ========================================
-- 1. Add assigned_branch_id column to users table
-- Purpose: Allow users to be assigned to specific branches (for receptionists and staff)
-- ========================================

-- Add the assigned_branch_id column
ALTER TABLE users
  ADD COLUMN assigned_branch_id CHAR(36) NULL COMMENT 'ID chi nhánh được gán cho người dùng' AFTER role;

-- Add foreign key constraint to ensure referential integrity
ALTER TABLE users
  ADD CONSTRAINT fk_users_assigned_branch
    FOREIGN KEY (assigned_branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_users_assigned_branch ON users(assigned_branch_id);

-- ========================================
-- 2. Add escalation fields to incidents table
-- Purpose: Allow incidents to be escalated to admins with tracking information
-- ========================================

-- Add escalation flag
ALTER TABLE incidents
  ADD COLUMN escalated_to_admin BOOLEAN DEFAULT FALSE COMMENT 'Sự cố đã được chuyển lên admin' AFTER resolution;

-- Add escalation timestamp
ALTER TABLE incidents
  ADD COLUMN escalated_at TIMESTAMP NULL COMMENT 'Thời gian chuyển sự cố lên admin' AFTER escalated_to_admin;

-- Add escalation reason
ALTER TABLE incidents
  ADD COLUMN escalation_reason TEXT NULL COMMENT 'Lý do chuyển sự cố lên admin' AFTER escalated_at;

-- Add escalated_by user reference
ALTER TABLE incidents
  ADD COLUMN escalated_by CHAR(36) NULL COMMENT 'ID người chuyển sự cố lên admin' AFTER escalation_reason;

-- Add foreign key constraint for escalated_by
ALTER TABLE incidents
  ADD CONSTRAINT fk_incidents_escalated_by
    FOREIGN KEY (escalated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create index on escalated_to_admin for filtering escalated incidents
CREATE INDEX idx_incidents_escalated ON incidents(escalated_to_admin);

-- ========================================
-- Rollback script (comment out when running migration)
-- ========================================
-- ALTER TABLE users
--   DROP FOREIGN KEY fk_users_assigned_branch,
--   DROP INDEX idx_users_assigned_branch,
--   DROP COLUMN assigned_branch_id;
--
-- ALTER TABLE incidents
--   DROP FOREIGN KEY fk_incidents_escalated_by,
--   DROP INDEX idx_incidents_escalated,
--   DROP COLUMN escalated_to_admin,
--   DROP COLUMN escalated_at,
--   DROP COLUMN escalation_reason,
--   DROP COLUMN escalated_by;
