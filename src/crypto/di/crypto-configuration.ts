import { ConfigService } from '@nestjs/config';
import { CryptoConfig, CryptoService } from '../core/crypto.service';

export const CryptoServiceFactory = (
  configService: ConfigService,
): CryptoService => {
  const CONFIG_BASE = 'CRYPTO_';

  const config: CryptoConfig = {
    ENCRYPTION_SECRET: configService.getOrThrow(
      CONFIG_BASE + 'ENCRYPTION_SECRET',
    ),
  };

  return new CryptoService(config);
};
