-- ========================================
-- Migration: Thêm chức năng thanh lý thiết bị
-- Mô tả: Thêm trạng thái 'disposed' và các trường disposal_date, disposal_reason vào bảng equipment
-- Ngày tạo: 2025-10-14
-- ========================================

USE igymcare;

-- Bước 1: Thêm trạng thái 'disposed' vào ENUM status
ALTER TABLE equipment
MODIFY COLUMN status ENUM('active', 'maintenance', 'inactive', 'disposed')
DEFAULT 'active'
COMMENT 'Trạng thái thiết bị';

-- Bước 2: Thêm cột disposal_date
ALTER TABLE equipment
ADD COLUMN disposal_date DATE NULL
COMMENT 'Ngày thanh lý'
AFTER status;

-- Bước 3: Thêm cột disposal_reason
ALTER TABLE equipment
ADD COLUMN disposal_reason TEXT NULL
COMMENT 'Lý do thanh lý'
AFTER disposal_date;

-- ========================================
-- Rollback script (nếu cần)
-- ========================================
-- ALTER TABLE equipment DROP COLUMN disposal_reason;
-- ALTER TABLE equipment DROP COLUMN disposal_date;
-- ALTER TABLE equipment MODIFY COLUMN status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active';
