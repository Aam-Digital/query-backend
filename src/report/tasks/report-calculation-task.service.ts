import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportCalculationProcessor } from './report-calculation-processor.service';
import { catchError } from 'rxjs';

@Injectable()
export class ReportCalculationTask {
  private readonly logger = new Logger(ReportCalculationTask.name);

  constructor(private reportCalculationProcessor: ReportCalculationProcessor) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  handleCron(): void {
    this.reportCalculationProcessor
      .processNextPendingCalculation()
      .pipe(
        catchError((err, caught) => {
          this.logger.log('reportCalculationProcessor', err, caught);
          throw err;
        }),
      )
      .subscribe((_) => {
        this.logger.log('done');
      });
  }
}
