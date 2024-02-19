import { Module } from '@nestjs/common';
import { CryptoService } from './core/crypto.service';
import { CryptoServiceFactory } from './di/crypto-configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CryptoService,
      useFactory: CryptoServiceFactory,
      inject: [ConfigService],
    },
  ],
  exports: [CryptoService],
})
export class CryptoModule {}
