import { Reflector } from '@nestjs/core';

/**
 * Annotate an endpoint to require a certain permission in the Auth token.
 * All the values in the array are required to gain access.
 */
export const Scopes = Reflector.createDecorator<string[]>();
