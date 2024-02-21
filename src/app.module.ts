import { HttpException, Module } from '@nestjs/common';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import { SeverityLevel } from '@sentry/types';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ReportModule } from './report/report.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfiguration } from './config/configuration';
import { ReportChangesModule } from './report-changes/report-changes.module';
import { NotificationModule } from './notification/notification.module';

const lowSeverityLevels: SeverityLevel[] = ['log', 'info'];

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: () =>
        new SentryInterceptor({
          filters: [
            {
              type: HttpException,
              filter: (exception: HttpException) => 500 > exception.getStatus(), // Only report 500 errors
            },
          ],
        }),
    },
  ],
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      load: [AppConfiguration],
    }),
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (!configService.get('SENTRY_DSN')) {
          return {};
        }

        return {
          dsn: configService.getOrThrow('SENTRY_DSN'),
          debug: true,
          environment: 'prod',
          release: 'query-backend@' + process.env.npm_package_version, // TODO: version turns out as undefined in Sentry
          whitelistUrls: [/https?:\/\/(.*)\.?aam-digital\.com/],
          initialScope: {
            tags: {
              // ID of the docker container in which this is run
              hostname: process.env.HOSTNAME || 'unknown',
            },
          },
          beforeSend: (event) => {
            if (lowSeverityLevels.includes(event.level as SeverityLevel)) {
              return null;
            } else {
              return event;
            }
          },
        };
      },
    }),
    ReportModule,
    ReportChangesModule,
    NotificationModule,
  ],
  controllers: [],
})
export class AppModule {}
