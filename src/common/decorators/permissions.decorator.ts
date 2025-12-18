import { SetMetadata } from '@nestjs/common';

export enum Permission {
  // Equipment permissions
  EQUIPMENT_CREATE = 'equipment:create',
  EQUIPMENT_READ = 'equipment:read',
  EQUIPMENT_UPDATE = 'equipment:update',
  EQUIPMENT_DELETE = 'equipment:delete',

  // Branch permissions
  BRANCH_CREATE = 'branch:create',
  BRANCH_READ = 'branch:read',
  BRANCH_UPDATE = 'branch:update',
  BRANCH_DELETE = 'branch:delete',

  // Maintenance permissions
  MAINTENANCE_CREATE = 'maintenance:create',
  MAINTENANCE_READ = 'maintenance:read',
  MAINTENANCE_UPDATE = 'maintenance:update',
  MAINTENANCE_DELETE = 'maintenance:delete',

  // User management permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Incident permissions
  INCIDENT_CREATE = 'incident:create',
  INCIDENT_READ = 'incident:read',
  INCIDENT_UPDATE = 'incident:update',
  INCIDENT_DELETE = 'incident:delete',

  // Report permissions
  REPORT_READ = 'report:read',
  REPORT_EXPORT = 'report:export',

  // Notification permissions
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_CREATE = 'notification:create',

  // Work shift permissions
  WORKSHIFT_READ = 'workshift:read',
  WORKSHIFT_CREATE = 'workshift:create',
  WORKSHIFT_UPDATE = 'workshift:update',

  // Usage log permissions
  USAGE_LOG_CREATE = 'usage_log:create',
  USAGE_LOG_READ = 'usage_log:read',
}

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator để định nghĩa permissions cần thiết cho một endpoint
 * @param permissions - Danh sách permissions cần thiết
 * @example
 * @Permissions(Permission.EQUIPMENT_READ, Permission.EQUIPMENT_UPDATE)
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator để đánh dấu endpoint cho phép truy cập công khai (không cần authentication)
 */
export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);
