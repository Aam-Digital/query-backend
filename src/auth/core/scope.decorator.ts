import { Reflector } from '@nestjs/core';

export const Scopes = Reflector.createDecorator<string[]>();
