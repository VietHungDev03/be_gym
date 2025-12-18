import { Injectable } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';
import { Permission } from '../decorators/permissions.decorator';

/**
 * Service quản lý mapping giữa roles và permissions
 */
@Injectable()
export class PermissionsService {
  private readonly rolePermissions: Map<UserRole, Permission[]> = new Map([
    // ADMIN - Toàn quyền
    [
      UserRole.ADMIN,
      [
        // Equipment
        Permission.EQUIPMENT_CREATE,
        Permission.EQUIPMENT_READ,
        Permission.EQUIPMENT_UPDATE,
        Permission.EQUIPMENT_DELETE,
        // Branch
        Permission.BRANCH_CREATE,
        Permission.BRANCH_READ,
        Permission.BRANCH_UPDATE,
        Permission.BRANCH_DELETE,
        // Maintenance
        Permission.MAINTENANCE_CREATE,
        Permission.MAINTENANCE_READ,
        Permission.MAINTENANCE_UPDATE,
        Permission.MAINTENANCE_DELETE,
        // User
        Permission.USER_CREATE,
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        // Incident
        Permission.INCIDENT_CREATE,
        Permission.INCIDENT_READ,
        Permission.INCIDENT_UPDATE,
        Permission.INCIDENT_DELETE,
        // Report
        Permission.REPORT_READ,
        Permission.REPORT_EXPORT,
        // Notification
        Permission.NOTIFICATION_READ,
        Permission.NOTIFICATION_CREATE,
        // Work Shift
        Permission.WORKSHIFT_READ,
        Permission.WORKSHIFT_CREATE,
        Permission.WORKSHIFT_UPDATE,
        // Usage Log
        Permission.USAGE_LOG_CREATE,
        Permission.USAGE_LOG_READ,
      ],
    ],

    // MANAGER - Quản lý thiết bị, chi nhánh, lịch bảo trì, nhân viên, xem báo cáo
    [
      UserRole.MANAGER,
      [
        // Equipment - CRUD
        Permission.EQUIPMENT_CREATE,
        Permission.EQUIPMENT_READ,
        Permission.EQUIPMENT_UPDATE,
        Permission.EQUIPMENT_DELETE,
        // Branch - Read và Update (chi nhánh của họ)
        Permission.BRANCH_READ,
        Permission.BRANCH_UPDATE,
        // Maintenance - CRUD
        Permission.MAINTENANCE_CREATE,
        Permission.MAINTENANCE_READ,
        Permission.MAINTENANCE_UPDATE,
        Permission.MAINTENANCE_DELETE,
        // User - Read (xem nhân viên)
        Permission.USER_READ,
        // Incident - Read và Update
        Permission.INCIDENT_READ,
        Permission.INCIDENT_UPDATE,
        // Report - Read
        Permission.REPORT_READ,
        Permission.REPORT_EXPORT,
        // Notification
        Permission.NOTIFICATION_READ,
        // Work Shift
        Permission.WORKSHIFT_READ,
        Permission.WORKSHIFT_CREATE,
        Permission.WORKSHIFT_UPDATE,
      ],
    ],

    // TECHNICIAN - Xem thiết bị được giao, cập nhật kết quả bảo trì
    [
      UserRole.TECHNICIAN,
      [
        // Equipment - Read (thiết bị được giao)
        Permission.EQUIPMENT_READ,
        // Maintenance - Read và Update (task được giao)
        Permission.MAINTENANCE_READ,
        Permission.MAINTENANCE_UPDATE,
        // Incident - Read và Update (sự cố được giao)
        Permission.INCIDENT_READ,
        Permission.INCIDENT_UPDATE,
        // Notification
        Permission.NOTIFICATION_READ,
        // Work Shift
        Permission.WORKSHIFT_READ,
      ],
    ],

    // RECEPTIONIST - Xem thiết bị, tạo và xem sự cố, xem thông báo và chi nhánh
    [
      UserRole.RECEPTIONIST,
      [
        // Equipment - Read
        Permission.EQUIPMENT_READ,
        // Incident - Create và Read
        Permission.INCIDENT_CREATE,
        Permission.INCIDENT_READ,
        // Notification - Read
        Permission.NOTIFICATION_READ,
        // Branch - Read
        Permission.BRANCH_READ,
      ],
    ],

    // USER - Quét RFID, xem thông tin, gửi báo lỗi
    [
      UserRole.USER,
      [
        // Equipment - Read (thông tin thiết bị qua RFID)
        Permission.EQUIPMENT_READ,
        // Incident - Create và Read (báo lỗi)
        Permission.INCIDENT_CREATE,
        Permission.INCIDENT_READ,
        // Usage Log
        Permission.USAGE_LOG_CREATE,
        Permission.USAGE_LOG_READ,
      ],
    ],
  ]);

  /**
   * Kiểm tra xem user có permission cụ thể không
   */
  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = this.rolePermissions.get(userRole);
    return permissions ? permissions.includes(permission) : false;
  }

  /**
   * Kiểm tra xem user có ít nhất một trong các permissions không
   */
  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(userRole, permission));
  }

  /**
   * Kiểm tra xem user có tất cả các permissions không
   */
  hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(userRole, permission));
  }

  /**
   * Lấy tất cả permissions của một role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return this.rolePermissions.get(role) || [];
  }

  /**
   * Kiểm tra xem user có quyền truy cập resource cụ thể không
   * Ví dụ: Technician chỉ có thể xem maintenance được assign cho họ
   */
  canAccessResource(
    userRole: UserRole,
    userId: string,
    resourceOwnerId: string | null,
    permission: Permission,
  ): boolean {
    // Admin có thể truy cập tất cả
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Manager có thể truy cập tất cả trong branch của họ
    if (userRole === UserRole.MANAGER) {
      return this.hasPermission(userRole, permission);
    }

    // Technician chỉ có thể truy cập resource được giao cho họ
    if (userRole === UserRole.TECHNICIAN) {
      // Nếu là read permission, cho phép xem
      if (permission.endsWith(':read')) {
        return this.hasPermission(userRole, permission);
      }
      // Nếu là update, chỉ cho phép update resource của họ
      if (permission.endsWith(':update')) {
        return (
          this.hasPermission(userRole, permission) &&
          resourceOwnerId === userId
        );
      }
      return false;
    }

    // User chỉ có thể truy cập resource của họ
    if (userRole === UserRole.USER) {
      if (permission.endsWith(':create')) {
        return this.hasPermission(userRole, permission);
      }
      if (permission.endsWith(':read')) {
        return this.hasPermission(userRole, permission);
      }
      return false;
    }

    return false;
  }
}
