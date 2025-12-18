-- Migration: Thêm các trường bổ sung cho bảng users
-- Date: 2025-10-05

USE igymcare;

-- Thêm các columns mới vào bảng users
ALTER TABLE users
  ADD COLUMN phone_number VARCHAR(20) NULL COMMENT 'Số điện thoại' AFTER full_name,
  ADD COLUMN date_of_birth DATE NULL COMMENT 'Ngày sinh' AFTER phone_number,
  ADD COLUMN address TEXT NULL COMMENT 'Địa chỉ' AFTER date_of_birth,
  ADD COLUMN emergency_contact VARCHAR(255) NULL COMMENT 'Liên hệ khẩn cấp' AFTER address,
  ADD COLUMN notes TEXT NULL COMMENT 'Ghi chú' AFTER emergency_contact;

-- Kiểm tra kết quả
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'igymcare'
  AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
