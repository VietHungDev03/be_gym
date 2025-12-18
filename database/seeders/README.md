# Database Seeders

Thư mục này chứa các file SQL seeder để populate dữ liệu mẫu vào database.

## 📋 Danh sách Seeders

### `001_seed_initial_data.sql`
Seeder dữ liệu ban đầu bao gồm:
- **Users**: 9 users (1 admin, 2 managers, 3 technicians, 3 users)
- **Branches**: 5 chi nhánh gym tại TP.HCM
- **Equipment**: 21 thiết bị phân bổ đều các chi nhánh

## 🚀 Cách chạy Seeder

### Cách 1: Sử dụng script Windows (Khuyên dùng)

```bash
cd backend
scripts\run-seeder.bat
```

### Cách 2: Sử dụng MySQL Workbench

1. Mở MySQL Workbench
2. Kết nối đến database `igymcare`
3. File → Open SQL Script
4. Chọn file `backend/database/seeders/001_seed_initial_data.sql`
5. Click Execute (⚡)

### Cách 3: Command line trực tiếp

```bash
cd backend
mysql -u root -p igymcare < database/seeders/001_seed_initial_data.sql
```

## 🔐 Tài khoản mặc định sau khi seed

Password mặc định cho **TẤT CẢ** tài khoản: `123456`

| Role | Email | Họ tên | Ghi chú |
|------|-------|--------|---------|
| **Admin** | admin@igymcare.com | Nguyễn Văn Admin | Toàn quyền |
| **Manager** | manager1@igymcare.com | Trần Thị Mai | Quản lý Q1, Bình Thạnh |
| **Manager** | manager2@igymcare.com | Lê Văn Nam | Quản lý Q3, Tân Bình |
| **Technician** | tech1@igymcare.com | Phạm Văn Hùng | Kỹ thuật viên |
| **Technician** | tech2@igymcare.com | Hoàng Thị Lan | Kỹ thuật viên |
| **Technician** | tech3@igymcare.com | Đỗ Văn Tú | Kỹ thuật viên |
| **User** | user1@gmail.com | Nguyễn Thị Hoa | Thành viên |
| **User** | user2@gmail.com | Võ Văn Khoa | Thành viên |
| **User** | user3@gmail.com | Bùi Thị Linh | Thành viên |

## 🏢 Danh sách Chi nhánh

| Mã | Tên | Địa chỉ | Quản lý |
|----|-----|---------|---------|
| Q1-CENTER | Chi nhánh Quận 1 | 123 Nguyễn Huệ, Q1 | Trần Thị Mai |
| Q3-PREMIUM | Chi nhánh Quận 3 | 456 Võ Văn Tần, Q3 | Lê Văn Nam |
| BT-BASIC | Chi nhánh Bình Thạnh | 789 Xô Viết Nghệ Tĩnh, Bình Thạnh | Trần Thị Mai |
| TD-NEW | Chi nhánh Thủ Đức | 321 Võ Văn Ngân, Thủ Đức | Chưa có |
| TB-AIRPORT | Chi nhánh Tân Bình | 159 Hoàng Văn Thụ, Tân Bình | Lê Văn Nam |

## 🏋️ Thiết bị mẫu

- **21 thiết bị** phân bổ đều 5 chi nhánh
- Các loại: Máy chạy bộ, Xe đạp tập, Máy tập tạ, Tạ đơn/kép, v.v.
- Trạng thái: 19 active, 1 maintenance, 1 inactive
- Có đầy đủ: QR code, thông số kỹ thuật, ngày mua, bảo hành

## ⚠️ Lưu ý

- **CẢNH BÁO**: Seeder sẽ **XÓA TOÀN BỘ** dữ liệu cũ (TRUNCATE tables)
- Chỉ chạy seeder trong môi trường **DEVELOPMENT**
- **KHÔNG BAO GIỜ** chạy seeder trên production database!
- Sau khi seed, nên đổi password cho tất cả tài khoản

## 🛠️ Tạo password hash mới

Nếu cần tạo password hash mới:

```bash
cd backend
node scripts/generate-password-hash.js [password]

# Ví dụ:
node scripts/generate-password-hash.js myNewPassword123
```

## 📝 Kết quả sau khi seed

```
SEEDING COMPLETED!
- Total Users: 9
- Total Branches: 5
- Total Equipment: 21
```

## 🔄 Reset và Seed lại

Nếu muốn reset và seed lại từ đầu, chỉ cần chạy lại seeder:

```bash
scripts\run-seeder.bat
```

File seeder đã có logic TRUNCATE tự động.
