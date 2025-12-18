-- ========================================
-- Migration: Fix incompatible foreign keys
-- Mục đích: Sửa lỗi user_id foreign key constraints
-- Ngày tạo: 2025-10-26
-- ========================================

USE igymcare;

-- Drop tất cả foreign key constraints cũ trên các bảng có user_id
-- Notifications
SET @tablename = 'notifications';
SET @preparedStatement = (
  SELECT CONCAT('ALTER TABLE ', @tablename, ' DROP FOREIGN KEY ', CONSTRAINT_NAME, ';')
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = @tablename
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME LIKE '%user_id%'
  LIMIT 1
);
SET @preparedStatement = IFNULL(@preparedStatement, 'SELECT 1');
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Usage_logs
SET @tablename = 'usage_logs';
SET @preparedStatement = (
  SELECT CONCAT('ALTER TABLE ', @tablename, ' DROP FOREIGN KEY ', CONSTRAINT_NAME, ';')
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = @tablename
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME LIKE '%user_id%'
  LIMIT 1
);
SET @preparedStatement = IFNULL(@preparedStatement, 'SELECT 1');
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Đảm bảo user_id có cùng kiểu với users.id (VARCHAR(36))
-- Notifications
ALTER TABLE notifications MODIFY COLUMN user_id VARCHAR(36) NOT NULL;

-- Usage_logs
ALTER TABLE usage_logs MODIFY COLUMN user_id VARCHAR(36) NULL;

-- Rollback: Nếu cần
-- Chỉ cần để TypeORM tự tạo lại constraints khi synchronize = true
