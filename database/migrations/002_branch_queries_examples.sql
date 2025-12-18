-- ========================================
-- Query Examples: Lọc và thống kê theo chi nhánh
-- Hướng dẫn sử dụng các VIEW và query để thống kê
-- ========================================

-- ========================================
-- 1. LỌC THIẾT BỊ THEO CHI NHÁNH
-- ========================================

-- Lọc tất cả thiết bị của một chi nhánh cụ thể
SELECT * FROM equipment WHERE branch_id = 'xxx';

-- Lọc thiết bị đang hoạt động của chi nhánh CN001
SELECT e.*
FROM equipment e
JOIN branches b ON b.id = e.branch_id
WHERE b.code = 'CN001' AND e.status = 'active';

-- Đếm số lượng thiết bị theo loại trong một chi nhánh
SELECT
  e.type,
  COUNT(*) as total,
  SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active_count
FROM equipment e
WHERE e.branch_id = 'xxx'
GROUP BY e.type
ORDER BY total DESC;

-- ========================================
-- 2. THỐNG KÊ TỔNG QUAN THEO CHI NHÁNH
-- ========================================

-- Xem dashboard tổng hợp của TẤT CẢ chi nhánh
SELECT * FROM v_branch_dashboard ORDER BY branch_name;

-- Xem dashboard của MỘT chi nhánh cụ thể
SELECT * FROM v_branch_dashboard WHERE branch_code = 'CN001';

-- So sánh hiệu suất giữa các chi nhánh
SELECT
  branch_name,
  total_equipment,
  active_equipment,
  total_usage_minutes / NULLIF(active_equipment, 0) as avg_usage_per_equipment,
  total_maintenance_cost,
  total_incidents,
  active_alerts
FROM v_branch_dashboard
ORDER BY total_equipment DESC;

-- ========================================
-- 3. THỐNG KÊ THIẾT BỊ THEO CHI NHÁNH
-- ========================================

-- Tổng quan thiết bị tất cả chi nhánh
SELECT * FROM v_branch_equipment_summary ORDER BY total_equipment DESC;

-- Chi nhánh có nhiều thiết bị cần bảo trì nhất
SELECT
  branch_name,
  maintenance_equipment,
  inactive_equipment,
  (maintenance_equipment + inactive_equipment) as equipment_need_attention
FROM v_branch_equipment_summary
WHERE (maintenance_equipment + inactive_equipment) > 0
ORDER BY equipment_need_attention DESC;

-- ========================================
-- 4. THỐNG KÊ SỬ DỤNG THIẾT BỊ THEO CHI NHÁNH
-- ========================================

-- Lịch sử sử dụng theo chi nhánh
SELECT * FROM v_branch_usage_stats ORDER BY total_usage_minutes DESC;

-- Chi nhánh có mức độ sử dụng cao nhất
SELECT
  branch_name,
  total_usage_sessions,
  total_usage_minutes,
  ROUND(avg_session_duration, 2) as avg_session_minutes,
  unique_users
FROM v_branch_usage_stats
WHERE total_usage_sessions > 0
ORDER BY total_usage_minutes DESC
LIMIT 5;

-- Lịch sử sử dụng chi tiết theo chi nhánh trong 30 ngày gần đây
SELECT
  b.name as branch_name,
  e.name as equipment_name,
  u.full_name as user_name,
  ul.start_time,
  ul.duration
FROM usage_logs ul
JOIN equipment e ON e.id = ul.equipment_id
JOIN branches b ON b.id = e.branch_id
LEFT JOIN users u ON u.id = ul.user_id
WHERE ul.start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND b.code = 'CN001'  -- Thay đổi mã chi nhánh ở đây
ORDER BY ul.start_time DESC;

-- ========================================
-- 5. THỐNG KÊ BẢO TRÌ THEO CHI NHÁNH
-- ========================================

-- Tổng quan bảo trì theo chi nhánh
SELECT * FROM v_branch_maintenance_stats ORDER BY total_maintenance_records DESC;

-- Chi nhánh có chi phí bảo trì cao nhất
SELECT
  branch_name,
  total_maintenance_records,
  ROUND(total_maintenance_cost, 2) as total_cost,
  ROUND(avg_maintenance_cost, 2) as avg_cost,
  scheduled_count,
  in_progress_count
FROM v_branch_maintenance_stats
ORDER BY total_maintenance_cost DESC;

-- Lịch bảo trì sắp tới của một chi nhánh
SELECT
  b.name as branch_name,
  e.name as equipment_name,
  mr.type as maintenance_type,
  mr.scheduled_date,
  mr.priority,
  mr.status,
  u.full_name as assigned_to
FROM maintenance_records mr
JOIN equipment e ON e.id = mr.equipment_id
JOIN branches b ON b.id = e.branch_id
LEFT JOIN users u ON u.id = mr.assigned_to
WHERE b.code = 'CN001'  -- Thay đổi mã chi nhánh ở đây
  AND mr.status IN ('scheduled', 'in_progress')
  AND mr.scheduled_date >= NOW()
ORDER BY mr.scheduled_date ASC;

-- ========================================
-- 6. THỐNG KÊ SỰ CỐ THEO CHI NHÁNH
-- ========================================

-- Tổng quan sự cố theo chi nhánh
SELECT * FROM v_branch_incident_stats ORDER BY total_incidents DESC;

-- Chi nhánh có nhiều sự cố nghiêm trọng nhất
SELECT
  branch_name,
  total_incidents,
  critical_incidents,
  high_incidents,
  reported_count,
  investigating_count
FROM v_branch_incident_stats
WHERE total_incidents > 0
ORDER BY (critical_incidents + high_incidents) DESC;

-- Sự cố đang xử lý theo chi nhánh
SELECT
  b.name as branch_name,
  e.name as equipment_name,
  i.description,
  i.severity,
  i.status,
  i.reported_at,
  u.full_name as assigned_to
FROM incidents i
JOIN equipment e ON e.id = i.equipment_id
JOIN branches b ON b.id = e.branch_id
LEFT JOIN users u ON u.id = i.assigned_to
WHERE b.code = 'CN001'  -- Thay đổi mã chi nhánh ở đây
  AND i.status IN ('reported', 'investigating')
ORDER BY i.severity DESC, i.reported_at DESC;

-- ========================================
-- 7. THỐNG KÊ CẢNH BÁO THEO CHI NHÁNH
-- ========================================

-- Tổng quan cảnh báo theo chi nhánh
SELECT * FROM v_branch_alert_stats ORDER BY active_alerts DESC;

-- Chi nhánh có nhiều cảnh báo đang hoạt động nhất
SELECT
  branch_name,
  active_alerts,
  critical_alerts,
  high_alerts
FROM v_branch_alert_stats
WHERE active_alerts > 0
ORDER BY critical_alerts DESC, high_alerts DESC;

-- Cảnh báo đang hoạt động theo chi nhánh
SELECT
  b.name as branch_name,
  e.name as equipment_name,
  a.type as alert_type,
  a.severity,
  a.title,
  a.message,
  a.created_at
FROM alerts a
JOIN branches b ON b.id = a.branch_id
JOIN equipment e ON e.id = a.equipment_id
WHERE b.code = 'CN001'  -- Thay đổi mã chi nhánh ở đây
  AND a.status = 'active'
ORDER BY a.severity DESC, a.created_at DESC;

-- ========================================
-- 8. THỐNG KÊ CA LÀM VIỆC THEO CHI NHÁNH
-- ========================================

-- Ca làm việc trong tuần này theo chi nhánh
SELECT
  b.name as branch_name,
  u.full_name as technician_name,
  ws.shift_name,
  ws.shift_date,
  ws.start_time,
  ws.end_time,
  ws.status
FROM work_shifts ws
JOIN branches b ON b.id = ws.branch_id
JOIN users u ON u.id = ws.technician_id
WHERE b.code = 'CN001'  -- Thay đổi mã chi nhánh ở đây
  AND ws.shift_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY ws.shift_date, ws.start_time;

-- Số lượng kỹ thuật viên đang làm việc theo chi nhánh
SELECT
  b.name as branch_name,
  COUNT(DISTINCT ws.technician_id) as total_technicians,
  COUNT(CASE WHEN ws.status = 'active' THEN 1 END) as active_shifts
FROM branches b
LEFT JOIN work_shifts ws ON ws.branch_id = b.id
  AND ws.shift_date = CURDATE()
GROUP BY b.id, b.name
ORDER BY total_technicians DESC;

-- ========================================
-- 9. BÁO CÁO CHI TIẾT THEO CHI NHÁNH
-- ========================================

-- Báo cáo chi tiết thiết bị của một chi nhánh
SELECT
  e.name as equipment_name,
  e.type,
  e.status,
  e.location,
  e.purchase_date,
  e.warranty_expiry,
  e.last_maintenance_date,
  DATEDIFF(CURDATE(), e.last_maintenance_date) as days_since_maintenance,
  (SELECT COUNT(*) FROM usage_logs ul WHERE ul.equipment_id = e.id) as total_uses,
  (SELECT COUNT(*) FROM incidents i WHERE i.equipment_id = e.id AND i.status != 'closed') as open_incidents
FROM equipment e
WHERE e.branch_id = (SELECT id FROM branches WHERE code = 'CN001')
ORDER BY e.status, e.name;

-- Báo cáo thiết bị cần bảo trì theo chi nhánh
SELECT
  b.name as branch_name,
  e.name as equipment_name,
  e.type,
  e.last_maintenance_date,
  e.maintenance_interval,
  DATE_ADD(e.last_maintenance_date, INTERVAL e.maintenance_interval DAY) as next_maintenance_due,
  DATEDIFF(DATE_ADD(e.last_maintenance_date, INTERVAL e.maintenance_interval DAY), CURDATE()) as days_until_due
FROM equipment e
JOIN branches b ON b.id = e.branch_id
WHERE e.status = 'active'
  AND e.last_maintenance_date IS NOT NULL
  AND DATEDIFF(CURDATE(), e.last_maintenance_date) >= e.maintenance_interval - 7  -- Cảnh báo trước 7 ngày
ORDER BY days_until_due ASC;

-- ========================================
-- 10. SO SÁNH HIỆU SUẤT GIỮA CÁC CHI NHÁNH
-- ========================================

-- So sánh tổng thể
SELECT
  b.name as branch_name,
  COUNT(DISTINCT e.id) as total_equipment,
  COUNT(DISTINCT ul.id) as total_usage_sessions,
  COALESCE(SUM(ul.duration), 0) as total_usage_minutes,
  COUNT(DISTINCT mr.id) as total_maintenance,
  COALESCE(SUM(mr.cost), 0) as total_maintenance_cost,
  COUNT(DISTINCT i.id) as total_incidents,
  COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) as active_alerts
FROM branches b
LEFT JOIN equipment e ON e.branch_id = b.id
LEFT JOIN usage_logs ul ON ul.equipment_id = e.id
LEFT JOIN maintenance_records mr ON mr.equipment_id = e.id
LEFT JOIN incidents i ON i.equipment_id = e.id
LEFT JOIN alerts a ON a.branch_id = b.id
WHERE b.status = 'active'
GROUP BY b.id, b.name
ORDER BY total_equipment DESC;

-- Hiệu suất sử dụng thiết bị (Usage efficiency)
SELECT
  branch_name,
  total_equipment,
  total_usage_minutes,
  ROUND(total_usage_minutes / NULLIF(total_equipment, 0), 2) as minutes_per_equipment,
  unique_users,
  ROUND(total_usage_minutes / NULLIF(unique_users, 0), 2) as minutes_per_user
FROM v_branch_usage_stats
WHERE total_equipment > 0
ORDER BY minutes_per_equipment DESC;
