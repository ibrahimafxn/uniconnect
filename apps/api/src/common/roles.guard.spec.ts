import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from './roles.enum';

const makeContext = (role?: Role) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  }) as any;

describe('RolesGuard', () => {
  it('allows when no roles required', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('denies when role missing', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(makeContext(Role.Student))).toThrow(
      ForbiddenException,
    );
  });

  it('allows when role matches', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeContext(Role.Admin))).toBe(true);
  });
});
