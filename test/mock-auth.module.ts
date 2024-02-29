import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/auth/core/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';

/**
 * Can be used as an overrideModule replacement of AuthModule to disable the JwtAuthGuard and remove need for external Auth server.
 */
@Module({
  imports: [
    HttpModule,
    JwtModule.register({
      global: true,
      secret: 'TEST_SECRET',
    }),
  ],
  providers: [
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [JwtAuthGuard],
})
export class MockAuthModule {
  constructor() {
    // disable auth guard
    JwtAuthGuard.prototype.canActivate = jest.fn().mockReturnValue(true);
  }
}
