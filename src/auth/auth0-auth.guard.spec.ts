import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Auth0AuthGuard } from './auth0-auth.guard';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'jwks'),
  jwtVerify: jest.fn(),
}));
import { jwtVerify } from 'jose';

const contextFor = (req: Record<string, unknown>): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => req }) }) as unknown as ExecutionContext;

describe('Auth0AuthGuard', () => {
  const guard = new Auth0AuthGuard();

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.AUTH0_DOMAIN = 'tenant.auth0.com';
    process.env.AUTH0_AUDIENCE = 'https://api.life-tasks';
  });

  it('rejects a request with no bearer token', async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token that fails verification', async () => {
    (jwtVerify as jest.Mock).mockRejectedValue(new Error('bad signature'));
    await expect(guard.canActivate(contextFor({ headers: { authorization: 'Bearer nope' } }))).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it('accepts a valid token and attaches the user id and token', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: { sub: 'auth0|123' } });
    const req: Record<string, unknown> = { headers: { authorization: 'Bearer good' } };

    await expect(guard.canActivate(contextFor(req))).resolves.toBe(true);
    expect(req.auth).toEqual({ userId: 'auth0|123', token: 'good' });
  });
});
