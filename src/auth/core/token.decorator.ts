import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtTokenPayload } from './jwt-auth.guard';

/**
 * Extract token payload for advanced checks.
 */
export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtTokenPayload | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request['jwt-token-payload'];
  },
);
