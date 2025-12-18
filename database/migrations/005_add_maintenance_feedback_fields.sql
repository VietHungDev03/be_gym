-- Migration: Add maintenance feedback fields
-- Purpose: Thêm các trường để lưu phản hồi bảo trì từ kỹ thuật viên
-- Date: 2025-10-14

USE igymcare;

-- Thêm các trường phản hồi bảo trì vào bảng maintenance_records
ALTER TABLE maintenance_records
  ADD COLUMN work_performed TEXT NULL COMMENT 'Công việc đã thực hiện chi tiết' AFTER cost,
  ADD COLUMN issues_found TEXT NULL COMMENT 'Các vấn đề/lỗi phát hiện trong quá trình bảo trì' AFTER work_performed,
  ADD COLUMN parts_replaced JSON NULL COMMENT 'Danh sách linh kiện đã thay thế [{name, quantity, cost}]' AFTER issues_found,
  ADD COLUMN has_remaining_issues BOOLEAN DEFAULT FALSE COMMENT 'Còn lỗi chưa khắc phục' AFTER parts_replaced,
  ADD COLUMN technician_notes TEXT NULL COMMENT 'Ghi chú của kỹ thuật viên sau bảo trì' AFTER has_remaining_issues,
  ADD COLUMN feedback_submitted_at TIMESTAMP NULL COMMENT 'Thời gian submit phản hồi' AFTER technician_notes;

-- Rollback script (comment out when running migration)
-- ALTER TABLE maintenance_records
--   DROP COLUMN work_performed,
--   DROP COLUMN issues_found,
--   DROP COLUMN parts_replaced,
--   DROP COLUMN has_remaining_issues,
--   DROP COLUMN technician_notes,
--   DROP COLUMN feedback_submitted_at;
