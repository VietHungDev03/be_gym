-- ========================================
-- Migration: Tạo bảng maintenance_schedules
-- Mục đích: Lưu trữ lịch bảo trì định kỳ tự động
-- ========================================

USE igymcare;

-- ========================================
-- Table: maintenance_schedules
-- Lịch bảo trì định kỳ (tự động tạo maintenance_records)
-- ========================================
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  name VARCHAR(255) NOT NULL COMMENT 'Tên lịch bảo trì (VD: Bảo trì định kỳ máy chạy bộ)',
  description TEXT COMMENT 'Mô tả chi tiết về công việc bảo trì',

  -- ========================================
  -- PHẠM VI ÁP DỤNG (ít nhất 1 trong 3)
  -- ========================================
  equipment_id VARCHAR(36) NULL COMMENT 'ID thiết bị cụ thể (NULL = áp dụng theo type/branch)',
  equipment_type VARCHAR(100) NULL COMMENT 'Loại thiết bị (VD: Máy chạy bộ - áp dụng cho tất cả)',
  branch_id VARCHAR(36) NULL COMMENT 'ID chi nhánh (áp dụng cho tất cả thiết bị trong chi nhánh)',

  -- ========================================
  -- THÔNG TIN BẢO TRÌ
  -- ========================================
  maintenance_type ENUM('preventive', 'corrective', 'emergency') NOT NULL DEFAULT 'preventive' COMMENT 'Loại bảo trì',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'Độ ưu tiên',
  assigned_to VARCHAR(36) NULL COMMENT 'ID kỹ thuật viên phụ trách mặc định',

  -- ========================================
  -- LỊCH TRÌNH
  -- ========================================
  start_date DATE NOT NULL COMMENT 'Ngày bắt đầu lịch bảo trì',
  recurrence_interval INT NOT NULL COMMENT 'Chu kỳ lặp lại (số ngày). VD: 30 = 30 ngày/lần',
  next_scheduled_date DATE NOT NULL COMMENT 'Ngày bảo trì tiếp theo (tự động cập nhật)',
  end_date DATE NULL COMMENT 'Ngày kết thúc lịch (NULL = không giới hạn)',

  -- ========================================
  -- TRẠNG THÁI
  -- ========================================
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Lịch có đang hoạt động không',

  -- ========================================
  -- METADATA
  -- ========================================
  created_by VARCHAR(36) COMMENT 'ID người tạo lịch',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',

  -- ========================================
  -- FOREIGN KEYS
  -- ========================================
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  -- ========================================
  -- INDEXES
  -- ========================================
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_equipment_type (equipment_type),
  INDEX idx_branch_id (branch_id),
  INDEX idx_next_scheduled_date (next_scheduled_date),
  INDEX idx_is_active (is_active),
  INDEX idx_assigned_to (assigned_to),

  -- ========================================
  -- CONSTRAINT: Ít nhất 1 trong 3 phải có giá trị
  -- ========================================
  CHECK (
    equipment_id IS NOT NULL OR
    equipment_type IS NOT NULL OR
    branch_id IS NOT NULL
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch bảo trì định kỳ tự động';

-- ========================================
-- NOTES & USAGE:
-- ========================================
-- 1. Lên lịch cho 1 thiết bị: Chỉ set equipment_id
-- 2. Lên lịch cho nhóm thiết bị: Chỉ set equipment_type (VD: 'Máy chạy bộ')
-- 3. Lên lịch cho toàn chi nhánh: Chỉ set branch_id
-- 4. Có thể kết hợp: VD equipment_type + branch_id = Tất cả máy chạy bộ tại chi nhánh A
--
-- Hệ thống sẽ tự động:
-- - Tạo maintenance_records cho các thiết bị phù hợp khi đến next_scheduled_date
-- - Cập nhật next_scheduled_date = next_scheduled_date + recurrence_interval
-- ========================================
