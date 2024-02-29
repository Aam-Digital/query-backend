import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './core/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtConfigurationFactory } from './core/jwt.configuration';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: JwtConfigurationFactory,
      inject: [ConfigService],
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
export class AuthModule {}
