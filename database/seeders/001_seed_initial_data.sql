-- ========================================
-- Seeder: Dữ liệu mẫu ban đầu
-- Mục đích: Populate users, branches, equipment để test
-- Ngày tạo: 2025-10-26
-- ========================================

USE igymcare;

-- Xóa dữ liệu cũ (cẩn thận - chỉ dùng trong dev!)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE usage_logs;
TRUNCATE TABLE maintenance_records;
TRUNCATE TABLE incidents;
TRUNCATE TABLE iot_sensors;
TRUNCATE TABLE equipment;
TRUNCATE TABLE branches;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- SEED USERS
-- Password mặc định cho tất cả: "123456"
-- Hash: $2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2
-- ========================================

-- Admin user
INSERT INTO users (id, email, password_hash, full_name, phone_number, role, status, created_at) VALUES
('admin-001', 'admin@igymcare.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Nguyễn Văn Admin', '0901234567', 'admin', 'active', NOW());

-- Manager users
INSERT INTO users (id, email, password_hash, full_name, phone_number, date_of_birth, role, status, created_at) VALUES
('manager-001', 'manager1@igymcare.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Trần Thị Mai', '0912345678', '1985-03-15', 'manager', 'active', NOW()),
('manager-002', 'manager2@igymcare.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Lê Văn Nam', '0923456789', '1988-07-20', 'manager', 'active', NOW());

-- Technician users
INSERT INTO users (id, email, password_hash, full_name, phone_number, date_of_birth, role, status, created_at) VALUES
('tech-001', 'tech1@igymcare.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Phạm Văn Hùng', '0934567890', '1992-05-10', 'technician', 'active', NOW()),
('tech-002', 'tech2@igymcare.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Hoàng Thị Lan', '0945678901', '1995-11-25', 'technician', 'active', NOW()),
('tech-003', 'tech3@igymcare.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Đỗ Văn Tú', '0956789012', '1990-08-30', 'technician', 'active', NOW());

-- Regular users
INSERT INTO users (id, email, password_hash, full_name, phone_number, date_of_birth, address, role, status, created_at) VALUES
('user-001', 'user1@gmail.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Nguyễn Thị Hoa', '0967890123', '1998-02-14', '123 Lê Lợi, Q1, TP.HCM', 'user', 'active', NOW()),
('user-002', 'user2@gmail.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Võ Văn Khoa', '0978901234', '1996-09-20', '456 Nguyễn Huệ, Q1, TP.HCM', 'user', 'active', NOW()),
('user-003', 'user3@gmail.com', '$2b$10$GY6nCJ3JgkpaNX2sXkioEOI7x5CzFNfdxPKEQX5xleRKtiR3CteW2', 'Bùi Thị Linh', '0989012345', '2000-12-05', '789 Trần Hưng Đạo, Q5, TP.HCM', 'user', 'active', NOW());

-- ========================================
-- SEED BRANCHES
-- ========================================

INSERT INTO branches (id, name, code, address, phone, email, manager_id, opening_hours, status, description, created_at) VALUES
('branch-001', 'Chi nhánh Quận 1', 'Q1-CENTER', '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', '0283822001', 'q1@igymcare.com', 'manager-001', '06:00 - 22:00', 'active', 'Chi nhánh trung tâm tại Quận 1, thiết bị hiện đại, đầy đủ tiện nghi', NOW()),
('branch-002', 'Chi nhánh Quận 3', 'Q3-PREMIUM', '456 Võ Văn Tần, Phường 5, Quận 3, TP.HCM', '0283822002', 'q3@igymcare.com', 'manager-002', '05:30 - 23:00', 'active', 'Chi nhánh cao cấp với đầy đủ dịch vụ spa và yoga', NOW()),
('branch-003', 'Chi nhánh Bình Thạnh', 'BT-BASIC', '789 Xô Viết Nghệ Tĩnh, Phường 25, Bình Thạnh, TP.HCM', '0283822003', 'binhthanh@igymcare.com', 'manager-001', '06:00 - 21:00', 'active', 'Chi nhánh tiêu chuẩn phục vụ khu vực Bình Thạnh', NOW()),
('branch-004', 'Chi nhánh Thủ Đức', 'TD-NEW', '321 Võ Văn Ngân, Phường Linh Chiểu, Thủ Đức, TP.HCM', '0283822004', 'thuduc@igymcare.com', NULL, '06:00 - 22:00', 'active', 'Chi nhánh mới khai trương tại khu đô thị Thủ Đức', NOW()),
('branch-005', 'Chi nhánh Tân Bình', 'TB-AIRPORT', '159 Hoàng Văn Thụ, Phường 8, Tân Bình, TP.HCM', '0283822005', 'tanbinh@igymcare.com', 'manager-002', '05:00 - 23:00', 'active', 'Chi nhánh gần sân bay, phục vụ 24/7 cuối tuần', NOW());

-- ========================================
-- SEED EQUIPMENT
-- ========================================

-- Branch Q1 - Thiết bị Cardio
INSERT INTO equipment (id, branch_id, name, type, description, location, specifications, qr_code, purchase_date, warranty_expiry, maintenance_interval, last_maintenance_date, status, created_at) VALUES
('eq-001', 'branch-001', 'Máy chạy bộ Life Fitness T3', 'Máy chạy bộ', 'Máy chạy bộ cao cấp với màn hình cảm ứng', 'Khu vực Cardio - Tầng 1', 'Động cơ 3.0HP, Tốc độ max 20km/h, Độ dốc 15%', 'EQ_1730000001_Q1C001', '2024-01-15', '2026-01-15', 30, '2024-09-15', 'active', NOW()),
('eq-002', 'branch-001', 'Máy chạy bộ Technogym Run', 'Máy chạy bộ', 'Máy chạy bộ chuyên nghiệp', 'Khu vực Cardio - Tầng 1', 'Động cơ 3.5HP, Tốc độ max 22km/h', 'EQ_1730000002_Q1C002', '2024-01-15', '2026-01-15', 30, '2024-09-20', 'active', NOW()),
('eq-003', 'branch-001', 'Xe đạp tập Matrix U50', 'Xe đạp tập thể dục', 'Xe đạp tập với 25 mức độ kháng lực', 'Khu vực Cardio - Tầng 1', '25 levels, Màn hình LCD, Bluetooth', 'EQ_1730000003_Q1C003', '2024-02-01', '2026-02-01', 45, '2024-08-01', 'active', NOW()),
('eq-004', 'branch-001', 'Máy chèo thuyền Concept2', 'Máy chèo thuyền', 'Máy chèo thuyền chuyên nghiệp', 'Khu vực Cardio - Tầng 1', 'Model D, Màn hình PM5', 'EQ_1730000004_Q1C004', '2024-02-10', '2026-02-10', 60, '2024-06-10', 'active', NOW());

-- Branch Q1 - Thiết bị Strength
INSERT INTO equipment (id, branch_id, name, type, description, location, specifications, qr_code, purchase_date, warranty_expiry, maintenance_interval, last_maintenance_date, status, created_at) VALUES
('eq-005', 'branch-001', 'Máy tập ngực Hammer Strength', 'Máy tập tạ', 'Máy tập cơ ngực chuyên nghiệp', 'Khu vực Strength - Tầng 2', 'Tải trọng max 200kg, Olympic plates', 'EQ_1730000005_Q1S001', '2024-01-20', '2026-01-20', 60, '2024-07-20', 'active', NOW()),
('eq-006', 'branch-001', 'Máy tập vai Cybex Eagle', 'Máy tập vai', 'Máy tập cơ vai deltoid', 'Khu vực Strength - Tầng 2', 'Tải trọng max 150kg', 'EQ_1730000006_Q1S002', '2024-01-20', '2026-01-20', 60, NULL, 'active', NOW()),
('eq-007', 'branch-001', 'Bộ tạ đơn 1-50kg', 'Tạ đơn', 'Bộ tạ đơn đầy đủ từ 1-50kg', 'Khu vực Free Weight - Tầng 2', 'Cao su bọc ngoài, Chống rỉ', 'EQ_1730000007_Q1F001', '2024-01-25', '2026-01-25', 90, NULL, 'active', NOW()),
('eq-008', 'branch-001', 'Ghế tập đa năng Adjustable Bench', 'Dụng cụ cardio', 'Ghế tập điều chỉnh nhiều góc', 'Khu vực Free Weight - Tầng 2', 'Điều chỉnh 7 góc độ', 'EQ_1730000008_Q1F002', '2024-02-01', '2026-02-01', 90, NULL, 'active', NOW());

-- Branch Q3 - Premium Equipment
INSERT INTO equipment (id, branch_id, name, type, description, location, specifications, qr_code, purchase_date, warranty_expiry, maintenance_interval, last_maintenance_date, status, created_at) VALUES
('eq-009', 'branch-002', 'Máy chạy bộ Technogym Skillrun', 'Máy chạy bộ', 'Máy chạy bộ cao cấp nhất với chế độ slatbelt', 'Khu vực Premium Cardio', 'Slatbelt, Power analysis, Touchscreen 19"', 'EQ_1730000009_Q3P001', '2024-03-01', '2026-03-01', 30, '2024-09-01', 'active', NOW()),
('eq-010', 'branch-002', 'Máy tập toàn thân Synrgy360', 'Máy tập tạ', 'Hệ thống tập luyện functional training', 'Khu vực Functional Training', 'Đa năng, Phù hợp group training', 'EQ_1730000010_Q3F001', '2024-03-05', '2026-03-05', 45, '2024-08-05', 'active', NOW()),
('eq-011', 'branch-002', 'Máy tập chân Leg Press 45', 'Máy tập chân', 'Máy tập chân với góc 45 độ', 'Khu vực Strength', 'Tải trọng max 300kg', 'EQ_1730000011_Q3S001', '2024-03-10', '2026-03-10', 60, NULL, 'maintenance', NOW()),
('eq-012', 'branch-002', 'Máy tập bụng Ab Coaster', 'Máy tập bụng', 'Máy tập cơ bụng chuyên nghiệp', 'Khu vực Abs Zone', 'Điều chỉnh độ cao, LCD screen', 'EQ_1730000012_Q3A001', '2024-03-15', '2026-03-15', 60, NULL, 'active', NOW());

-- Branch Bình Thạnh
INSERT INTO equipment (id, branch_id, name, type, description, location, specifications, qr_code, purchase_date, warranty_expiry, maintenance_interval, last_maintenance_date, status, created_at) VALUES
('eq-013', 'branch-003', 'Máy chạy bộ BH Fitness', 'Máy chạy bộ', 'Máy chạy bộ phổ thông', 'Khu vực Cardio', 'Động cơ 2.5HP, Tốc độ max 16km/h', 'EQ_1730000013_BT001', '2024-04-01', '2026-04-01', 30, '2024-09-01', 'active', NOW()),
('eq-014', 'branch-003', 'Xe đạp tập cố định', 'Xe đạp tập thể dục', 'Xe đạp tập spin bike', 'Khu vực Cardio', '20 mức độ kháng lực', 'EQ_1730000014_BT002', '2024-04-05', '2026-04-05', 45, NULL, 'active', NOW()),
('eq-015', 'branch-003', 'Máy tập đa năng Home Gym', 'Máy tập tạ', 'Máy tập đa năng cho mọi cơ', 'Khu vực Strength', 'Station tập 50+ bài tập', 'EQ_1730000015_BT003', '2024-04-10', '2026-04-10', 60, NULL, 'active', NOW());

-- Branch Thủ Đức
INSERT INTO equipment (id, branch_id, name, type, description, location, specifications, qr_code, purchase_date, warranty_expiry, maintenance_interval, last_maintenance_date, status, created_at) VALUES
('eq-016', 'branch-004', 'Máy chạy bộ Precor', 'Máy chạy bộ', 'Máy chạy bộ thương mại', 'Tầng 1 - Cardio Zone', 'Động cơ 3.0HP, Touchscreen', 'EQ_1730000016_TD001', '2024-09-01', '2026-09-01', 30, NULL, 'active', NOW()),
('eq-017', 'branch-004', 'Máy chạy bộ Matrix T7xe', 'Máy chạy bộ', 'Máy chạy bộ cao cấp', 'Tầng 1 - Cardio Zone', 'Động cơ 4.0HP, Console XE', 'EQ_1730000017_TD002', '2024-09-01', '2026-09-01', 30, NULL, 'active', NOW()),
('eq-018', 'branch-004', 'Bộ tạ Kettlebell 8-32kg', 'Tạ kép', 'Bộ kettlebell hoàn chỉnh', 'Tầng 2 - Functional', 'Cast iron, 6 sizes', 'EQ_1730000018_TD003', '2024-09-05', '2026-09-05', 90, NULL, 'active', NOW());

-- Branch Tân Bình
INSERT INTO equipment (id, branch_id, name, type, description, location, specifications, qr_code, purchase_date, warranty_expiry, maintenance_interval, last_maintenance_date, status, created_at) VALUES
('eq-019', 'branch-005', 'Máy chạy bộ Star Trac', 'Máy chạy bộ', 'Máy chạy bộ cao cấp', 'Ground Floor - Cardio', 'Động cơ 3.5HP, 15" LCD', 'EQ_1730000019_TB001', '2024-06-01', '2026-06-01', 30, '2024-09-01', 'active', NOW()),
('eq-020', 'branch-005', 'Máy tập elliptical Precor', 'Dụng cụ cardio', 'Máy tập luyện toàn thân', 'Ground Floor - Cardio', 'Low impact, Adjustable stride', 'EQ_1730000020_TB002', '2024-06-05', '2026-06-05', 45, NULL, 'active', NOW()),
('eq-021', 'branch-005', 'Máy Smith Machine', 'Máy tập tạ', 'Máy squat và bench press', '2nd Floor - Strength', 'Tải trọng max 250kg, Olympic bar', 'EQ_1730000021_TB003', '2024-06-10', '2026-06-10', 60, NULL, 'inactive', NOW());

-- ========================================
-- SUMMARY
-- ========================================
-- Users: 1 Admin + 2 Managers + 3 Technicians + 3 Users = 9 users
-- Branches: 5 chi nhánh
-- Equipment: 21 thiết bị trải đều các chi nhánh
-- ========================================

SELECT 'SEEDING COMPLETED!' AS status,
       (SELECT COUNT(*) FROM users) AS total_users,
       (SELECT COUNT(*) FROM branches) AS total_branches,
       (SELECT COUNT(*) FROM equipment) AS total_equipment;
