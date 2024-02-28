import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Scopes } from './scope.decorator';

/**
 * Represents a validated JwtTokenPayload
 */
export interface JwtTokenPayload {
  exp?: string;
  iat?: string;
  jti?: string;
  iss?: string;
  sub?: string;
  typ?: string;
  azp?: string; // client-id
  scope?: string;
}

/**
 * JwtAuthGuard
 *
 * Checks if a valid JWT token is sent within the request.
 *
 * Implemented checks (this order):
 * - token set in Authentication header
 * - expiration check
 * - notBefore check
 * - issuer public key
 * - typ check for 'Bearer'
 * - scope check
 *
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      console.debug(`[JwtAuthGuard]: No token found in Header`);
      throw new UnauthorizedException('No token found in Header');
    }

    let payload: JwtTokenPayload;

    try {
      payload = this.jwtService.verify<JwtTokenPayload>(token, {
        ignoreExpiration: false,
        ignoreNotBefore: false,
      });
    } catch (err: any) {
      console.debug(`[JwtAuthGuard]: ${err.name} -> ${err.message}`);
      throw new UnauthorizedException(`${err.message}`);
    }

    if (payload.typ !== 'Bearer') {
      console.debug(`[JwtAuthGuard]: Invalid 'typ'. Must be a 'Bearer' Token.`);
      throw new UnauthorizedException(
        "Invalid 'typ'. Must be a 'Bearer' TokenDecorator",
      );
    }

    this.validateScope(context, payload);

    request['jwt-token-payload'] = payload;

    return true;
  }

  private validateScope(context: ExecutionContext, payload: JwtTokenPayload) {
    const neededScopes = this.reflector.get(Scopes, context.getHandler());
    const areScopesSufficient = this.areScopesSufficient(
      neededScopes,
      payload.scope,
    );

    if (!areScopesSufficient) {
      console.debug(`[JwtAuthGuard]: Missing scope(s): ${neededScopes}`);
      throw new UnauthorizedException(`Missing scope(s): ${neededScopes}`);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const headers: any = request.headers;
    const [type, token] = headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Returns true if user have all required scopes
   *
   * @param neededScopes all scopes required for this request e.g. ['scope-a', 'scope-b']
   * @param userScope  all user scopes from jwt e.g. 'scope-a scope-b'
   */
  private areScopesSufficient(
    neededScopes: string[],
    userScope: string | undefined,
  ) {
    if (userScope === undefined) {
      return neededScopes.length === 0;
    }
    const userScopes = userScope.split(' ');
    for (let i = 0; i < neededScopes.length; i++) {
      if (userScopes.indexOf(neededScopes[i]) === -1) {
        return false;
      }
    }
    return true;
  }
}
