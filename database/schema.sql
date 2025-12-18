-- ========================================
-- iGymCare Database Schema
-- MySQL Database cho hệ thống quản lý thiết bị gym
-- ========================================

-- Tạo database
CREATE DATABASE IF NOT EXISTS igymcare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE igymcare;

-- ========================================
-- Table: users
-- Lưu trữ thông tin người dùng (thay Firebase Auth + Firestore users)
-- ========================================
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email đăng nhập',
  password_hash VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã hash (bcrypt)',
  full_name VARCHAR(255) NOT NULL COMMENT 'Họ và tên',
  phone_number VARCHAR(20) NULL COMMENT 'Số điện thoại',
  date_of_birth DATE NULL COMMENT 'Ngày sinh',
  address TEXT NULL COMMENT 'Địa chỉ',
  emergency_contact VARCHAR(255) NULL COMMENT 'Liên hệ khẩn cấp',
  notes TEXT NULL COMMENT 'Ghi chú',
  role ENUM('admin', 'manager', 'technician', 'user') DEFAULT 'user' COMMENT 'Vai trò người dùng',
  assigned_branch_id VARCHAR(36) NULL COMMENT 'ID chi nhánh được gán cho người dùng',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Trạng thái tài khoản',
  last_login_at TIMESTAMP NULL COMMENT 'Lần đăng nhập cuối',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_assigned_branch (assigned_branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quản lý người dùng';

-- ========================================
-- Table: branches
-- Quản lý chi nhánh gym
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
-- Table: equipment
-- Lưu trữ thông tin thiết bị gym (thay Firestore equipment)
-- ========================================
CREATE TABLE equipment (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  branch_id VARCHAR(36) COMMENT 'ID chi nhánh',
  name VARCHAR(255) NOT NULL COMMENT 'Tên thiết bị',
  type VARCHAR(100) NOT NULL COMMENT 'Loại thiết bị (Máy chạy bộ, Máy tập tạ...)',
  description TEXT COMMENT 'Mô tả chi tiết',
  location VARCHAR(255) COMMENT 'Vị trí đặt thiết bị',
  specifications TEXT COMMENT 'Thông số kỹ thuật',
  qr_code VARCHAR(100) UNIQUE COMMENT 'Mã QR/RFID',
  purchase_date DATE COMMENT 'Ngày mua',
  warranty_expiry DATE COMMENT 'Ngày hết bảo hành',
  maintenance_interval INT DEFAULT 30 COMMENT 'Chu kỳ bảo trì (ngày)',
  last_maintenance_date DATE NULL COMMENT 'Ngày bảo trì gần nhất',
  status ENUM('active', 'maintenance', 'inactive', 'disposed') DEFAULT 'active' COMMENT 'Trạng thái thiết bị',
  disposal_date DATE NULL COMMENT 'Ngày thanh lý',
  disposal_reason TEXT NULL COMMENT 'Lý do thanh lý',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  INDEX idx_branch_id (branch_id),
  INDEX idx_qr_code (qr_code),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quản lý thiết bị';

-- ========================================
-- Table: usage_logs
-- Lịch sử sử dụng thiết bị (thay Firestore usage_logs)
-- ========================================
CREATE TABLE usage_logs (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  equipment_id VARCHAR(36) NOT NULL COMMENT 'ID thiết bị',
  user_id VARCHAR(36) COMMENT 'ID người dùng',
  start_time TIMESTAMP NOT NULL COMMENT 'Thời gian bắt đầu sử dụng',
  end_time TIMESTAMP NULL COMMENT 'Thời gian kết thúc sử dụng',
  duration INT NULL COMMENT 'Thời lượng sử dụng (phút)',
  status ENUM('in_use', 'completed') DEFAULT 'in_use' COMMENT 'Trạng thái sử dụng',
  notes TEXT COMMENT 'Ghi chú',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử sử dụng thiết bị';

-- ========================================
-- Table: maintenance_records
-- Lịch bảo trì thiết bị (thay Firestore maintenance_records)
-- ========================================
CREATE TABLE maintenance_records (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  equipment_id VARCHAR(36) NOT NULL COMMENT 'ID thiết bị',
  type ENUM('preventive', 'corrective', 'emergency') NOT NULL COMMENT 'Loại bảo trì',
  description TEXT NOT NULL COMMENT 'Mô tả công việc bảo trì',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'Độ ưu tiên',
  scheduled_date TIMESTAMP NOT NULL COMMENT 'Ngày lên lịch bảo trì',
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled' COMMENT 'Trạng thái bảo trì',
  assigned_to VARCHAR(36) COMMENT 'ID kỹ thuật viên được giao',
  actual_date TIMESTAMP NULL COMMENT 'Ngày thực hiện',
  completed_by VARCHAR(36) COMMENT 'ID người hoàn thành',
  notes TEXT COMMENT 'Ghi chú bảo trì',
  cost DECIMAL(10,2) DEFAULT 0 COMMENT 'Chi phí bảo trì',
  -- Phản hồi bảo trì từ kỹ thuật viên
  work_performed TEXT NULL COMMENT 'Công việc đã thực hiện chi tiết',
  issues_found TEXT NULL COMMENT 'Các vấn đề/lỗi phát hiện trong quá trình bảo trì',
  parts_replaced JSON NULL COMMENT 'Danh sách linh kiện đã thay thế [{name, quantity, cost}]',
  has_remaining_issues BOOLEAN DEFAULT FALSE COMMENT 'Còn lỗi chưa khắc phục',
  technician_notes TEXT NULL COMMENT 'Ghi chú của kỹ thuật viên sau bảo trì',
  feedback_submitted_at TIMESTAMP NULL COMMENT 'Thời gian submit phản hồi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_status (status),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch bảo trì thiết bị';

-- ========================================
-- Table: incidents
-- Báo cáo sự cố thiết bị (thay Firestore incidents)
-- ========================================
CREATE TABLE incidents (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  equipment_id VARCHAR(36) NOT NULL COMMENT 'ID thiết bị',
  description TEXT NOT NULL COMMENT 'Mô tả sự cố',
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'Mức độ nghiêm trọng',
  status ENUM('reported', 'investigating', 'resolved', 'closed') DEFAULT 'reported' COMMENT 'Trạng thái xử lý',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'Độ ưu tiên',
  reported_by VARCHAR(36) COMMENT 'ID người báo cáo',
  assigned_to VARCHAR(36) COMMENT 'ID kỹ thuật viên được giao',
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian báo cáo',
  resolved_at TIMESTAMP NULL COMMENT 'Thời gian giải quyết',
  resolution TEXT COMMENT 'Cách giải quyết',
  escalated_to_admin BOOLEAN DEFAULT FALSE COMMENT 'Sự cố đã được chuyển lên admin',
  escalated_at TIMESTAMP NULL COMMENT 'Thời gian chuyển sự cố lên admin',
  escalation_reason TEXT NULL COMMENT 'Lý do chuyển sự cố lên admin',
  escalated_by VARCHAR(36) NULL COMMENT 'ID người chuyển sự cố lên admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (escalated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_status (status),
  INDEX idx_severity (severity),
  INDEX idx_reported_at (reported_at),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_priority (priority),
  INDEX idx_escalated (escalated_to_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Báo cáo sự cố';

-- ========================================
-- Table: iot_sensors
-- Cảm biến IoT (TÍNH NĂNG MỚI - thay mock data)
-- ========================================
CREATE TABLE iot_sensors (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  equipment_id VARCHAR(36) NOT NULL COMMENT 'ID thiết bị',
  name VARCHAR(255) NOT NULL COMMENT 'Tên cảm biến',
  type ENUM('temperature', 'vibration', 'smoke') NOT NULL COMMENT 'Loại cảm biến',
  status ENUM('online', 'offline') DEFAULT 'offline' COMMENT 'Trạng thái kết nối',
  value DECIMAL(10,2) DEFAULT 0 COMMENT 'Giá trị hiện tại',
  unit VARCHAR(20) COMMENT 'Đơn vị đo (°C, Hz, ppm...)',
  threshold_min DECIMAL(10,2) COMMENT 'Ngưỡng tối thiểu',
  threshold_max DECIMAL(10,2) COMMENT 'Ngưỡng tối đa',
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Lần cập nhật cuối',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_last_update (last_update)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cảm biến IoT';

-- ========================================
-- Table: work_shifts
-- Quản lý ca làm việc của nhân viên bảo trì
-- ========================================
CREATE TABLE work_shifts (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  technician_id VARCHAR(36) NOT NULL COMMENT 'ID kỹ thuật viên',
  branch_id VARCHAR(36) COMMENT 'ID chi nhánh',
  shift_name VARCHAR(100) NOT NULL COMMENT 'Tên ca (Sáng, Chiều, Tối...)',
  shift_date DATE NOT NULL COMMENT 'Ngày làm việc',
  start_time TIME NOT NULL COMMENT 'Giờ bắt đầu',
  end_time TIME NOT NULL COMMENT 'Giờ kết thúc',
  status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled' COMMENT 'Trạng thái ca làm',
  notes TEXT COMMENT 'Ghi chú',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  INDEX idx_technician_id (technician_id),
  INDEX idx_branch_id (branch_id),
  INDEX idx_shift_date (shift_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ca làm việc';

-- ========================================
-- Table: notifications
-- Thông báo và cảnh báo cho kỹ thuật viên
-- ========================================
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  user_id VARCHAR(36) NOT NULL COMMENT 'ID người nhận',
  type ENUM('maintenance', 'incident', 'alert', 'system') NOT NULL COMMENT 'Loại thông báo',
  title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề',
  message TEXT NOT NULL COMMENT 'Nội dung thông báo',
  reference_id VARCHAR(36) COMMENT 'ID tham chiếu (maintenance_id, incident_id...)',
  reference_type VARCHAR(50) COMMENT 'Loại tham chiếu (maintenance, incident...)',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'Độ ưu tiên',
  is_read BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc chưa',
  read_at TIMESTAMP NULL COMMENT 'Thời gian đọc',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_priority (priority),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông báo';

-- ========================================
-- Table: alerts
-- Cảnh báo bảo trì và IoT (TÍNH NĂNG MỚI)
-- ========================================
CREATE TABLE alerts (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  type ENUM('maintenance_due', 'maintenance_overdue', 'sensor_anomaly', 'sensor_offline') NOT NULL COMMENT 'Loại cảnh báo',
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'Mức độ nghiêm trọng',
  status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active' COMMENT 'Trạng thái cảnh báo',
  equipment_id VARCHAR(36) NOT NULL COMMENT 'ID thiết bị',
  branch_id VARCHAR(36) COMMENT 'ID chi nhánh (denormalized từ equipment để query nhanh)',
  maintenance_id VARCHAR(36) NULL COMMENT 'ID lịch bảo trì (nếu là cảnh báo maintenance)',
  sensor_id VARCHAR(36) NULL COMMENT 'ID cảm biến (nếu là cảnh báo IoT)',
  title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề cảnh báo',
  message TEXT NOT NULL COMMENT 'Nội dung cảnh báo chi tiết',
  sensor_value DECIMAL(10,2) NULL COMMENT 'Giá trị cảm biến tại thời điểm cảnh báo',
  threshold_violated VARCHAR(50) NULL COMMENT 'Ngưỡng bị vi phạm (min/max)',
  notification_sent BOOLEAN DEFAULT FALSE COMMENT 'Đã gửi thông báo chưa',
  notification_channels JSON COMMENT 'Các kênh đã gửi (email, sms)',
  assigned_to VARCHAR(36) NULL COMMENT 'ID người được giao xử lý',
  acknowledged_by VARCHAR(36) NULL COMMENT 'ID người xác nhận',
  acknowledged_at TIMESTAMP NULL COMMENT 'Thời gian xác nhận',
  resolved_by VARCHAR(36) NULL COMMENT 'ID người giải quyết',
  resolved_at TIMESTAMP NULL COMMENT 'Thời gian giải quyết',
  resolution_notes TEXT COMMENT 'Ghi chú giải quyết',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (maintenance_id) REFERENCES maintenance_records(id) ON DELETE CASCADE,
  FOREIGN KEY (sensor_id) REFERENCES iot_sensors(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_severity (severity),
  INDEX idx_status (status),
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_branch_id (branch_id),
  INDEX idx_maintenance_id (maintenance_id),
  INDEX idx_sensor_id (sensor_id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at),
  INDEX idx_status_severity (status, severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cảnh báo bảo trì và IoT';

-- ========================================
-- Foreign Key Constraints (Added after all tables)
-- ========================================

-- Add foreign key for users.assigned_branch_id to branches.id
-- Note: This is added here because branches table is created after users table
ALTER TABLE users
  ADD CONSTRAINT fk_users_assigned_branch
    FOREIGN KEY (assigned_branch_id) REFERENCES branches(id) ON DELETE SET NULL;

