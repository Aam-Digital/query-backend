import { Test, TestingModule } from '@nestjs/testing';
import { CouchdbReportChangesService } from './couchdb-report-changes.service';
import { BehaviorSubject, map } from 'rxjs';
import { NotificationService } from '../../notification/core/notification.service';
import { Reference } from '../../domain/reference';

describe('CouchdbReportChangesService', () => {
  let service: CouchdbReportChangesService;
  let mockNotificationService: Partial<NotificationService>;

  let activeReports: BehaviorSubject<string[]>;

  beforeEach(async () => {
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
        CouchdbReportChangesService,
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<CouchdbReportChangesService>(
      CouchdbReportChangesService,
    );
  });

  it('should trigger core after adding active report through NotificationService', (done) => {
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

  it('should trigger core after adding active report through NotificationService', async () => {
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
