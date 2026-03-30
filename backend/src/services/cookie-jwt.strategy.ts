import {AuthenticationStrategy} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {HttpErrors, Request, RestBindings} from '@loopback/rest';
import {UserProfile, securityId} from '@loopback/security';
import * as jwt from 'jsonwebtoken';

/**
 * Custom authentication strategy that reads the JWT from the
 * httpOnly cookie named 'token' instead of the Authorization header.
 * This avoids the XSS risk of storing tokens in localStorage.
 */
export class CookieJwtStrategy implements AuthenticationStrategy {
  name = 'cookie-jwt';

  constructor(
    @inject(RestBindings.Http.REQUEST)
    private request: Request,
  ) {}

  async authenticate(): Promise<UserProfile | undefined> {
    const token = this.request.cookies?.token;
    if (!token) {
      throw new HttpErrors.Unauthorized('No auth cookie found');
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ?? 'secret',
      ) as jwt.JwtPayload;

      return {
        [securityId]: String(decoded.id),
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
    } catch {
      throw new HttpErrors.Unauthorized('Invalid or expired token');
    }
  }
}
