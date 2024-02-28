import { ReportChangesService } from './report-changes.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { NotificationService } from '../../notification/core/notification.service';
import { ReportingStorage } from '../../report/storage/reporting-storage.service';
import { CouchDbChangesService } from '../storage/couch-db-changes.service';
import {
  CreateReportCalculationSuccess,
  CreateReportCalculationUseCase,
} from '../../report/core/use-cases/create-report-calculation-use-case.service';
import {
  DatabaseChangeResult,
  DocChangeDetails,
} from '../storage/database-changes.service';
import { ReportSchemaGenerator } from '../../report/core/report-schema-generator';
import { ReportChangeDetector } from './report-change-detector';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../../domain/report-calculation';

describe('ReportChangesService', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: ReportChangesService;
  let mockNotificationService: Partial<NotificationService>;
  let mockCreateReportCalculationUseCase: Partial<CreateReportCalculationUseCase>;
  let mockReportStorage: Partial<ReportingStorage>;

  let activeReports: BehaviorSubject<string[]>;
  let mockedChangesStream: Subject<DocChangeDetails>;

  beforeEach(async () => {
    mockedChangesStream = new Subject<DocChangeDetails>();
    mockNotificationService = {
      activeReports: () => of([]),
      triggerNotification: jest.fn(),
    };
    mockCreateReportCalculationUseCase = { startReportCalculation: jest.fn() };
    mockReportStorage = {
      fetchReport: jest.fn(),
    };

    service = new ReportChangesService(
      mockNotificationService as NotificationService,
      mockReportStorage as ReportingStorage,
      {
        subscribeToAllNewChangesWithDocs: () => mockedChangesStream,
      } as Partial<CouchDbChangesService> as CouchDbChangesService,
      mockCreateReportCalculationUseCase as CreateReportCalculationUseCase,
      new ReportSchemaGenerator(),
    );

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  function simulateDocChange(
    change: Partial<DatabaseChangeResult> = { id: 'Person:1', doc: {} },
  ) {
    mockedChangesStream.next({
      change: change as DatabaseChangeResult,
      previousDoc: undefined,
      newDoc: change.doc,
    });
  }

  it('should not check changes if NotificationService has active reports', () => {
    mockNotificationService.activeReports = jest.fn().mockReturnValue(of([]));

    simulateDocChange();
    jest.runOnlyPendingTimers();

    expect(
      mockCreateReportCalculationUseCase.startReportCalculation,
    ).not.toHaveBeenCalled();
  });

  it('should check changes if NotificationService has active reports', (done) => {
    mockNotificationService.triggerNotification = jest
      .fn()
      .mockImplementation((event) => {
        console.log('triggerNotification', event);
        done();
      });

    const report = {
      id: 'ReportConfig:1',
      queries: ['SELECT _id FROM Person'],
    };

    jest
      .spyOn(ReportChangeDetector.prototype, 'affectsReport')
      .mockImplementation(() => true);

    mockNotificationService.activeReports = jest
      .fn()
      .mockReturnValue(of([{ id: report.id }]));
    mockReportStorage.fetchReport = jest.fn().mockReturnValue(of(report));

    const calculationResult: ReportCalculation = new ReportCalculation(
      '1',
      report,
    )
      .setStatus(ReportCalculationStatus.FINISHED_SUCCESS)
      .setOutcome({ result_hash: '123' });
    mockCreateReportCalculationUseCase.startReportCalculation = jest
      .fn()
      .mockReturnValue(
        of(new CreateReportCalculationSuccess(calculationResult)),
      );
    mockCreateReportCalculationUseCase.getCompletedReportCalculation = jest
      .fn()
      .mockReturnValue(of(calculationResult));

    simulateDocChange({ id: 'Person:1', doc: {} });
  });

  xit('should trigger even after adding active report through NotificationService', async () => {
    activeReports.next(['report1']);
    activeReports.next(['report2' /* removed report1 */]);

    // TODO mock a couchDbService.changes event

    await new Promise(process.nextTick); // wait for any async operations to finish
    expect(
      mockNotificationService.triggerNotification,
    ).not.toHaveBeenCalledWith('report1');
    expect(mockNotificationService.triggerNotification).toHaveBeenCalledWith(
      'report2',
    );
  });
});
