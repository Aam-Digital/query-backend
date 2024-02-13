import { Module } from '@nestjs/common';
import { ReportChangesService } from "./report-changes.service";

@Module({
  providers: [
    ReportChangesService
  ],
})
export class ReportChangesModule {
}
