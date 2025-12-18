-- ========================================
-- Migration: Thêm bảng branches và cập nhật equipment
-- Mục đích: Quản lý chi nhánh, mỗi thiết bị thuộc 1 chi nhánh
-- Ngày tạo: 2025-10-14
-- ========================================

USE igymcare;

-- ========================================
-- 1. Tạo bảng branches (Chi nhánh)
-- ========================================
CREATE TABLE branches (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  name VARCHAR(255) NOT NULL COMMENT 'Tên chi nhánh',
  code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã chi nhánh (unique)',
  address TEXT COMMENT 'Địa chỉ chi nhánh',
  phone VARCHAR(20) COMMENT 'Số điện thoại liên hệ',
  email VARCHAR(255) COMMENT 'Email chi nhánh',
  manager_id VARCHAR(36) COMMENT 'ID quản lý chi nhánh',
  opening_hours VARCHAR(255) COMMENT 'Giờ mở cửa (VD: 06:00-22:00)',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Trạng thái chi nhánh',
  description TEXT COMMENT 'Mô tả chi nhánh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_status (status),
  INDEX idx_manager_id (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quản lý chi nhánh';

-- ========================================
-- 2. Thêm trường branch_id vào các bảng liên quan
-- ========================================

-- Thêm branch_id vào bảng equipment
ALTER TABLE equipment
ADD COLUMN branch_id VARCHAR(36) COMMENT 'ID chi nhánh' AFTER id,
ADD CONSTRAINT fk_equipment_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
ADD INDEX idx_branch_id (branch_id);

-- Thêm branch_id vào bảng alerts (nếu bảng tồn tại)
ALTER TABLE alerts
ADD COLUMN branch_id VARCHAR(36) COMMENT 'ID chi nhánh (denormalized từ equipment để query nhanh)' AFTER equipment_id,
ADD CONSTRAINT fk_alerts_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
ADD INDEX idx_branch_id (branch_id);

-- Thêm branch_id vào bảng work_shifts (nếu bảng tồn tại)
ALTER TABLE work_shifts
ADD COLUMN branch_id VARCHAR(36) COMMENT 'ID chi nhánh' AFTER technician_id,
ADD CONSTRAINT fk_work_shifts_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
ADD INDEX idx_branch_id (branch_id);

-- ========================================
-- 3. Thêm dữ liệu mẫu cho chi nhánh (Optional - có thể bỏ qua)
-- ========================================
-- Chi nhánh mặc định
INSERT INTO branches (id, name, code, address, phone, email, status, description, opening_hours)
VALUES (
  UUID(),
  'Chi nhánh trung tâm',
  'CN001',
  '123 Đường ABC, Quận 1, TP.HCM',
  '0123456789',
  'central@igymcare.com',
  'active',
  'Chi nhánh trung tâm - Gym cao cấp với đầy đủ thiết bị hiện đại',
  '06:00-22:00'
);

-- Chi nhánh thứ 2
INSERT INTO branches (id, name, code, address, phone, email, status, description, opening_hours)
VALUES (
  UUID(),
  'Chi nhánh Quận 7',
  'CN002',
  '456 Đường XYZ, Quận 7, TP.HCM',
  '0987654321',
  'q7@igymcare.com',
  'active',
  'Chi nhánh Quận 7 - Không gian rộng rãi, thoáng mát',
  '06:00-23:00'
);

-- ========================================
-- 4. Tạo VIEW để thống kê theo chi nhánh
-- ========================================

-- VIEW: Thống kê tổng quan thiết bị theo chi nhánh
CREATE OR REPLACE VIEW v_branch_equipment_summary AS
SELECT
  b.id AS branch_id,
  b.name AS branch_name,
  b.code AS branch_code,
  b.status AS branch_status,
  COUNT(e.id) AS total_equipment,
  SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) AS active_equipment,
  SUM(CASE WHEN e.status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance_equipment,
  SUM(CASE WHEN e.status = 'inactive' THEN 1 ELSE 0 END) AS inactive_equipment,
  SUM(CASE WHEN e.status = 'disposed' THEN 1 ELSE 0 END) AS disposed_equipment
FROM branches b
LEFT JOIN equipment e ON e.branch_id = b.id
GROUP BY b.id, b.name, b.code, b.status;

-- VIEW: Thống kê lịch sử sử dụng thiết bị theo chi nhánh
CREATE OR REPLACE VIEW v_branch_usage_stats AS
SELECT
  b.id AS branch_id,
  b.name AS branch_name,
  COUNT(ul.id) AS total_usage_sessions,
  SUM(ul.duration) AS total_usage_minutes,
  AVG(ul.duration) AS avg_session_duration,
  COUNT(DISTINCT ul.equipment_id) AS equipment_used_count,
  COUNT(DISTINCT ul.user_id) AS unique_users
FROM branches b
LEFT JOIN equipment e ON e.branch_id = b.id
LEFT JOIN usage_logs ul ON ul.equipment_id = e.id
GROUP BY b.id, b.name;

-- VIEW: Thống kê bảo trì theo chi nhánh
CREATE OR REPLACE VIEW v_branch_maintenance_stats AS
SELECT
  b.id AS branch_id,
  b.name AS branch_name,
  COUNT(mr.id) AS total_maintenance_records,
  SUM(CASE WHEN mr.status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled_count,
  SUM(CASE WHEN mr.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
  SUM(CASE WHEN mr.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN mr.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
  SUM(mr.cost) AS total_maintenance_cost,
  AVG(mr.cost) AS avg_maintenance_cost
FROM branches b
LEFT JOIN equipment e ON e.branch_id = b.id
LEFT JOIN maintenance_records mr ON mr.equipment_id = e.id
GROUP BY b.id, b.name;

-- VIEW: Thống kê sự cố theo chi nhánh
CREATE OR REPLACE VIEW v_branch_incident_stats AS
SELECT
  b.id AS branch_id,
  b.name AS branch_name,
  COUNT(i.id) AS total_incidents,
  SUM(CASE WHEN i.status = 'reported' THEN 1 ELSE 0 END) AS reported_count,
  SUM(CASE WHEN i.status = 'investigating' THEN 1 ELSE 0 END) AS investigating_count,
  SUM(CASE WHEN i.status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
  SUM(CASE WHEN i.status = 'closed' THEN 1 ELSE 0 END) AS closed_count,
  SUM(CASE WHEN i.severity = 'critical' THEN 1 ELSE 0 END) AS critical_incidents,
  SUM(CASE WHEN i.severity = 'high' THEN 1 ELSE 0 END) AS high_incidents
FROM branches b
LEFT JOIN equipment e ON e.branch_id = b.id
LEFT JOIN incidents i ON i.equipment_id = e.id
GROUP BY b.id, b.name;

-- VIEW: Thống kê cảnh báo theo chi nhánh
CREATE OR REPLACE VIEW v_branch_alert_stats AS
SELECT
  b.id AS branch_id,
  b.name AS branch_name,
  COUNT(a.id) AS total_alerts,
  SUM(CASE WHEN a.status = 'active' THEN 1 ELSE 0 END) AS active_alerts,
  SUM(CASE WHEN a.status = 'acknowledged' THEN 1 ELSE 0 END) AS acknowledged_alerts,
  SUM(CASE WHEN a.status = 'resolved' THEN 1 ELSE 0 END) AS resolved_alerts,
  SUM(CASE WHEN a.severity = 'critical' THEN 1 ELSE 0 END) AS critical_alerts,
  SUM(CASE WHEN a.severity = 'high' THEN 1 ELSE 0 END) AS high_alerts
FROM branches b
LEFT JOIN alerts a ON a.branch_id = b.id
GROUP BY b.id, b.name;

-- VIEW: Dashboard tổng hợp theo chi nhánh
CREATE OR REPLACE VIEW v_branch_dashboard AS
SELECT
  b.id AS branch_id,
  b.name AS branch_name,
  b.code AS branch_code,
  b.address,
  b.phone,
  b.status AS branch_status,
  b.opening_hours,
  u.full_name AS manager_name,
  u.phone_number AS manager_phone,
  es.total_equipment,
  es.active_equipment,
  es.maintenance_equipment,
  us.total_usage_sessions,
  us.total_usage_minutes,
  ms.total_maintenance_records,
  ms.total_maintenance_cost,
  ist.total_incidents,
  ist.critical_incidents,
  als.active_alerts,
  als.critical_alerts
FROM branches b
LEFT JOIN users u ON u.id = b.manager_id
LEFT JOIN v_branch_equipment_summary es ON es.branch_id = b.id
LEFT JOIN v_branch_usage_stats us ON us.branch_id = b.id
LEFT JOIN v_branch_maintenance_stats ms ON ms.branch_id = b.id
LEFT JOIN v_branch_incident_stats ist ON ist.branch_id = b.id
LEFT JOIN v_branch_alert_stats als ON als.branch_id = b.id;

-- ========================================
-- 5. Rollback Script (Nếu cần khôi phục)
-- ========================================
-- USE igymcare;
-- DROP VIEW IF EXISTS v_branch_dashboard;
-- DROP VIEW IF EXISTS v_branch_alert_stats;
-- DROP VIEW IF EXISTS v_branch_incident_stats;
-- DROP VIEW IF EXISTS v_branch_maintenance_stats;
-- DROP VIEW IF EXISTS v_branch_usage_stats;
-- DROP VIEW IF EXISTS v_branch_equipment_summary;
-- ALTER TABLE work_shifts DROP FOREIGN KEY fk_work_shifts_branch;
-- ALTER TABLE work_shifts DROP INDEX idx_branch_id;
-- ALTER TABLE work_shifts DROP COLUMN branch_id;
-- ALTER TABLE alerts DROP FOREIGN KEY fk_alerts_branch;
-- ALTER TABLE alerts DROP INDEX idx_branch_id;
-- ALTER TABLE alerts DROP COLUMN branch_id;
-- ALTER TABLE equipment DROP FOREIGN KEY fk_equipment_branch;
-- ALTER TABLE equipment DROP INDEX idx_branch_id;
-- ALTER TABLE equipment DROP COLUMN branch_id;
-- DROP TABLE branches;
