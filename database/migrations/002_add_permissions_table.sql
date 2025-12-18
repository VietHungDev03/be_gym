-- ========================================
-- Migration: Add permissions and role-based access control
-- Date: 2025-10-14
-- Description: Thêm bảng permissions để quản lý quyền chi tiết hơn
-- ========================================

USE igymcare;

-- ========================================
-- Table: permissions
-- Lưu trữ các quyền hạn của từng role
-- ========================================
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  role ENUM('admin', 'manager', 'technician', 'user') NOT NULL COMMENT 'Vai trò',
  resource VARCHAR(50) NOT NULL COMMENT 'Tài nguyên (equipment, branches, maintenance...)',
  action ENUM('create', 'read', 'update', 'delete', 'all') NOT NULL COMMENT 'Hành động',
  description TEXT COMMENT 'Mô tả quyền',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  UNIQUE KEY unique_permission (role, resource, action),
  INDEX idx_role (role),
  INDEX idx_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quyền hạn theo vai trò';

-- ========================================
-- Insert default permissions
-- ========================================

-- ADMIN - Full access to everything
INSERT INTO permissions (id, role, resource, action, description) VALUES
(UUID(), 'admin', 'equipment', 'all', 'Admin có toàn quyền với thiết bị'),
(UUID(), 'admin', 'branches', 'all', 'Admin có toàn quyền với chi nhánh'),
(UUID(), 'admin', 'maintenance', 'all', 'Admin có toàn quyền với lịch bảo trì'),
(UUID(), 'admin', 'users', 'all', 'Admin có toàn quyền với người dùng'),
(UUID(), 'admin', 'incidents', 'all', 'Admin có toàn quyền với báo cáo sự cố'),
(UUID(), 'admin', 'reports', 'read', 'Admin có thể xem báo cáo'),
(UUID(), 'admin', 'notifications', 'all', 'Admin có toàn quyền với thông báo');

-- MANAGER - Manage resources in their branches
INSERT INTO permissions (id, role, resource, action, description) VALUES
(UUID(), 'manager', 'equipment', 'create', 'Quản lý có thể tạo thiết bị'),
(UUID(), 'manager', 'equipment', 'read', 'Quản lý có thể xem thiết bị'),
(UUID(), 'manager', 'equipment', 'update', 'Quản lý có thể cập nhật thiết bị'),
(UUID(), 'manager', 'equipment', 'delete', 'Quản lý có thể xóa thiết bị'),
(UUID(), 'manager', 'branches', 'read', 'Quản lý có thể xem chi nhánh'),
(UUID(), 'manager', 'branches', 'update', 'Quản lý có thể cập nhật chi nhánh của mình'),
(UUID(), 'manager', 'maintenance', 'create', 'Quản lý có thể tạo lịch bảo trì'),
(UUID(), 'manager', 'maintenance', 'read', 'Quản lý có thể xem lịch bảo trì'),
(UUID(), 'manager', 'maintenance', 'update', 'Quản lý có thể cập nhật lịch bảo trì'),
(UUID(), 'manager', 'maintenance', 'delete', 'Quản lý có thể xóa lịch bảo trì'),
(UUID(), 'manager', 'users', 'read', 'Quản lý có thể xem nhân viên'),
(UUID(), 'manager', 'incidents', 'read', 'Quản lý có thể xem sự cố'),
(UUID(), 'manager', 'incidents', 'update', 'Quản lý có thể cập nhật sự cố'),
(UUID(), 'manager', 'reports', 'read', 'Quản lý có thể xem báo cáo'),
(UUID(), 'manager', 'notifications', 'read', 'Quản lý có thể xem thông báo');

-- TECHNICIAN - View assigned tasks and update status
INSERT INTO permissions (id, role, resource, action, description) VALUES
(UUID(), 'technician', 'equipment', 'read', 'Kỹ thuật viên có thể xem thiết bị được giao'),
(UUID(), 'technician', 'maintenance', 'read', 'Kỹ thuật viên có thể xem lịch bảo trì được giao'),
(UUID(), 'technician', 'maintenance', 'update', 'Kỹ thuật viên có thể cập nhật kết quả bảo trì'),
(UUID(), 'technician', 'incidents', 'read', 'Kỹ thuật viên có thể xem sự cố được giao'),
(UUID(), 'technician', 'incidents', 'update', 'Kỹ thuật viên có thể cập nhật sự cố'),
(UUID(), 'technician', 'notifications', 'read', 'Kỹ thuật viên có thể xem thông báo'),
(UUID(), 'technician', 'work_shifts', 'read', 'Kỹ thuật viên có thể xem ca làm việc');

-- USER - View equipment info and report incidents
INSERT INTO permissions (id, role, resource, action, description) VALUES
(UUID(), 'user', 'equipment', 'read', 'Người dùng có thể xem thông tin thiết bị qua RFID'),
(UUID(), 'user', 'incidents', 'create', 'Người dùng có thể gửi báo cáo sự cố'),
(UUID(), 'user', 'incidents', 'read', 'Người dùng có thể xem sự cố của mình'),
(UUID(), 'user', 'usage_logs', 'create', 'Người dùng có thể tạo log sử dụng thiết bị'),
(UUID(), 'user', 'usage_logs', 'read', 'Người dùng có thể xem lịch sử sử dụng của mình');

-- ========================================
-- Table: audit_logs
-- Ghi lại các hành động quan trọng trong hệ thống
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  user_id VARCHAR(36) COMMENT 'ID người thực hiện',
  action VARCHAR(100) NOT NULL COMMENT 'Hành động (create, update, delete...)',
  resource_type VARCHAR(50) NOT NULL COMMENT 'Loại tài nguyên',
  resource_id VARCHAR(36) COMMENT 'ID tài nguyên',
  old_value JSON COMMENT 'Giá trị cũ (nếu update/delete)',
  new_value JSON COMMENT 'Giá trị mới (nếu create/update)',
  ip_address VARCHAR(45) COMMENT 'Địa chỉ IP',
  user_agent TEXT COMMENT 'User agent',
  status ENUM('success', 'failed') DEFAULT 'success' COMMENT 'Trạng thái',
  error_message TEXT COMMENT 'Thông báo lỗi nếu failed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian thực hiện',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource_type (resource_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký audit';
