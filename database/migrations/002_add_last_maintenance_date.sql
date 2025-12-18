-- ========================================
-- Migration: Add last_maintenance_date to equipment table
-- Description: Thêm trường last_maintenance_date để theo dõi lần bảo trì gần nhất
-- Date: 2025-10-14
-- ========================================

USE igymcare;

-- Thêm cột last_maintenance_date vào bảng equipment
ALTER TABLE equipment
ADD COLUMN last_maintenance_date DATE NULL COMMENT 'Ngày bảo trì gần nhất'
AFTER maintenance_interval;

-- Cập nhật last_maintenance_date dựa trên bản ghi bảo trì gần nhất (nếu có)
UPDATE equipment e
LEFT JOIN (
  SELECT
    equipment_id,
    MAX(actual_date) as last_date
  FROM maintenance_records
  WHERE status = 'completed' AND actual_date IS NOT NULL
  GROUP BY equipment_id
) m ON e.id = m.equipment_id
SET e.last_maintenance_date = DATE(m.last_date)
WHERE m.last_date IS NOT NULL;
