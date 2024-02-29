import {
  JwtModuleOptions,
  JwtVerifyOptions,
} from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map, switchMap } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';

export const JwtConfigurationFactory = (
  configService: ConfigService,
): Promise<JwtModuleOptions> => {
  const openIdConfigurationUrl = configService.getOrThrow(
    'OPENID_CONFIGURATION',
  );

  const axiosInstance = axios.create();
  const httpService = new HttpService(axiosInstance);

  return firstValueFrom(
    httpService.get(openIdConfigurationUrl).pipe(
      switchMap((openIdConfigResponse) => {
        const issuer = openIdConfigResponse.data.issuer;
        if (!issuer) {
          throw new InternalServerErrorException(
            `Could not load issuer from openid-configuration: ${openIdConfigurationUrl}`,
          );
        }
        return httpService.get(issuer);
      }),
      map((issuerResponse) => {
        const rawPublicKey = issuerResponse.data.public_key;
        if (!rawPublicKey) {
          throw new InternalServerErrorException(
            `Could not load public_key from issuer: ${openIdConfigurationUrl}`,
          );
        }
        return {
          publicKey: `-----BEGIN PUBLIC KEY-----\n${rawPublicKey}\n-----END PUBLIC KEY-----`,
        } as JwtVerifyOptions;
      }),
    ),
  );
};
