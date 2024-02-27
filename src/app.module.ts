import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ReportModule } from './report/report.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfiguration } from './config/configuration';
import { ReportChangesModule } from './report-changes/report-changes.module';
import { NotificationModule } from './notification/notification.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      load: [AppConfiguration],
    }),
    QueryModule,
    ReportModule,
    ReportChangesModule,
    NotificationModule,
  ],
  controllers: [],
})
export class AppModule {}
