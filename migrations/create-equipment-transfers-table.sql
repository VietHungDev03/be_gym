-- Migration: Create equipment_transfers table
-- Date: 2025-11-03
-- Description: Creates table to track equipment transfers between branches

CREATE TABLE IF NOT EXISTS equipment_transfers (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  from_branch_id VARCHAR(36) NULL,
  to_branch_id VARCHAR(36) NOT NULL,
  transfer_date DATE NOT NULL,
  requested_by VARCHAR(36) NOT NULL,
  approved_by VARCHAR(36) NULL,
  reason TEXT NULL,
  notes TEXT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (from_branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (to_branch_id) REFERENCES branches(id) ON DELETE CASCADE,

  -- Indexes for better query performance
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_from_branch (from_branch_id),
  INDEX idx_to_branch (to_branch_id),
  INDEX idx_status (status),
  INDEX idx_transfer_date (transfer_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE equipment_transfers COMMENT = 'Lưu trữ lịch sử điều chuyển thiết bị giữa các chi nhánh';
