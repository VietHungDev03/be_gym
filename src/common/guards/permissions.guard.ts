import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, Permission } from '../decorators/permissions.decorator';
import { PermissionsService } from '../services/permissions.service';

/**
 * Guard kiểm tra permissions của user
 * Sử dụng cùng với JwtAuthGuard và @Permissions decorator
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy permissions được yêu cầu từ decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không yêu cầu permissions cụ thể, cho phép truy cập
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Nếu không có user (chưa authenticated), từ chối
    if (!user) {
      throw new ForbiddenException(
        'Bạn cần đăng nhập để truy cập tài nguyên này',
      );
    }

    // Kiểm tra user có ít nhất một trong các permissions không
    const hasPermission = this.permissionsService.hasAnyPermission(
      user.role,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này',
      );
    }

    return true;
  }
}
