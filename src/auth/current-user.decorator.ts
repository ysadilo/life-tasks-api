import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './auth0-auth.guard';

function auth(ctx: ExecutionContext) {
  const { auth } = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!auth) throw new Error('Auth decorators used on a route without Auth0AuthGuard');
  return auth;
}

/** The authenticated Auth0 user id (`sub`). Only valid on routes guarded by {@link Auth0AuthGuard}. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => auth(ctx).userId);

/** The raw Auth0 access token — used to call `/userinfo` when bootstrapping a user. */
export const AccessToken = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => auth(ctx).token);
