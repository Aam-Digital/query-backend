import { Test, TestingModule } from '@nestjs/testing';
import { ReportChangesService } from './report-changes.service';
import { BehaviorSubject, map, of, Subject } from 'rxjs';
import { NotificationService } from '../../notification/core/notification.service';
import { Reference } from '../../domain/reference';
import { DefaultReportStorage } from '../../report/storage/report-storage.service';
import { CouchdbChangesService } from '../storage/couchdb-changes.service';
import { CreateReportCalculationUseCase } from '../../report/core/use-cases/create-report-calculation-use-case.service';
import { DatabaseChangeResult } from '../storage/database-changes.service';

describe('ReportChangesService', () => {
  let service: ReportChangesService;
  let mockNotificationService: Partial<NotificationService>;

  let activeReports: BehaviorSubject<string[]>;
  let mockedChangesStream: Subject<DatabaseChangeResult[]>;

  beforeEach(async () => {
    mockedChangesStream = new Subject<DatabaseChangeResult[]>();
    activeReports = new BehaviorSubject<string[]>([]);
    mockNotificationService = {
      activeReports: () =>
        activeReports
          .asObservable()
          .pipe(map((reportIds) => reportIds.map((id) => new Reference(id)))),
      triggerNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportChangesService,
        { provide: NotificationService, useValue: mockNotificationService },
        {
          provide: DefaultReportStorage,
          useValue: { fetchReport: () => of() },
        },
        {
          provide: CouchdbChangesService,
          useValue: { subscribeToAllNewChanges: () => mockedChangesStream },
        },
        {
          provide: CreateReportCalculationUseCase,
          useValue: null,
        },
      ],
    }).compile();

    service = module.get<ReportChangesService>(ReportChangesService);
  });

  xit('should trigger core after adding active report through NotificationService', (done) => {
    const testReportId = 'report1';
    activeReports.next([testReportId]);

    // TODO mock a couchDbService.changes event

    (
      mockNotificationService.triggerNotification as jest.Mock
    ).mockImplementation((reportId: string) => {
      expect(reportId).toBe(testReportId);
      done();
    });
  });

  xit('should trigger core after adding active report through NotificationService', async () => {
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
