-- ========================================
-- Migration: Tạo bảng alerts
-- Mục đích: Cảnh báo bảo trì và IoT
-- Ngày tạo: 2025-01-14
-- ========================================

USE igymcare;

-- Tạo bảng alerts
CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  type ENUM('maintenance_due', 'maintenance_overdue', 'sensor_anomaly', 'sensor_offline') NOT NULL COMMENT 'Loại cảnh báo',
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'Mức độ nghiêm trọng',
  status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active' COMMENT 'Trạng thái cảnh báo',
  equipment_id VARCHAR(36) NOT NULL COMMENT 'ID thiết bị',
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
  FOREIGN KEY (maintenance_id) REFERENCES maintenance_records(id) ON DELETE CASCADE,
  FOREIGN KEY (sensor_id) REFERENCES iot_sensors(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_severity (severity),
  INDEX idx_status (status),
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_maintenance_id (maintenance_id),
  INDEX idx_sensor_id (sensor_id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at),
  INDEX idx_status_severity (status, severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cảnh báo bảo trì và IoT';

-- Rollback script (nếu cần)
-- DROP TABLE IF EXISTS alerts;
