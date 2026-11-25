import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    const roles = user.roles || [];
    const isSuperAdmin = roles.some((r) => {
      if (typeof r === 'string') {
        return r === 'SUPER_ADMIN';
      }
      return (r as any)?.name === 'SUPER_ADMIN';
    });

    if (!isSuperAdmin) {
      throw new ForbiddenException('Access denied: Super Admin privileges required.');
    }

    return true;
  }
}
