import { Module, Global } from '@nestjs/common';
import { PermissionsService } from './services/permissions.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

/**
 * Common module chứa các shared services, guards, decorators
 * @Global decorator để module này available globally trong toàn app
 */
@Global()
@Module({
  providers: [
    PermissionsService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    PermissionsService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class CommonModule {}
