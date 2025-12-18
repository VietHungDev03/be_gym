-- ========================================
-- Migration: Thêm cột branch_id vào bảng alerts
-- Mục đích: Lưu branch_id từ equipment để query nhanh hơn
-- Ngày tạo: 2025-10-26
-- ========================================

USE igymcare;

-- Kiểm tra và thêm cột branch_id nếu chưa tồn tại
SET @dbname = DATABASE();
SET @tablename = 'alerts';
SET @columnname = 'branch_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Cột đã tồn tại, không làm gì
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(36) NULL COMMENT "ID chi nhánh (denormalized từ equipment)" AFTER equipment_id')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Thêm foreign key constraint nếu chưa có
SET @fk_name = 'fk_alerts_branch_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (CONSTRAINT_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (CONSTRAINT_NAME = @fk_name)
      AND (CONSTRAINT_TYPE = 'FOREIGN KEY')
  ) > 0,
  'SELECT 1', -- FK đã tồn tại
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Thêm index cho branch_id nếu chưa có
SET @index_name = 'idx_branch_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @index_name)
  ) > 0,
  'SELECT 1', -- Index đã tồn tại
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @index_name, ' (branch_id)')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Cập nhật branch_id cho các alert hiện có từ equipment
UPDATE alerts a
INNER JOIN equipment e ON a.equipment_id = e.id
SET a.branch_id = e.branch_id
WHERE a.branch_id IS NULL AND e.branch_id IS NOT NULL;

-- Rollback script (nếu cần)
-- ALTER TABLE alerts DROP FOREIGN KEY fk_alerts_branch_id;
-- ALTER TABLE alerts DROP INDEX idx_branch_id;
-- ALTER TABLE alerts DROP COLUMN branch_id;
