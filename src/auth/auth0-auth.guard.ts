import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface AuthedRequest {
  headers: Record<string, string | string[] | undefined>;
  auth?: { userId: string; token: string };
}

/**
 * Verifies an Auth0 access token (RS256, signed via the tenant JWKS) on the
 * `Authorization: Bearer` header and attaches `{ auth: { userId, token } }`.
 * This is phase 4 from the README — `boardId`/`ownerId` are no longer trusted
 * from the client.
 */
@Injectable()
export class Auth0AuthGuard implements CanActivate {
  private jwks?: JWTVerifyGetKey;

  private get keySet(): JWTVerifyGetKey {
    const domain = process.env.AUTH0_DOMAIN;
    if (!domain) throw new UnauthorizedException('Auth is not configured (AUTH0_DOMAIN)');
    if (!this.jwks) {
      this.jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));
    }
    return this.jwks;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;

    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length);

    try {
      const { payload } = await jwtVerify(token, this.keySet, {
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        audience: process.env.AUTH0_AUDIENCE,
      });
      if (!payload.sub) throw new Error('token has no sub');
      req.auth = { userId: payload.sub, token };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
