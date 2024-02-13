import { Test, TestingModule } from '@nestjs/testing';
import { ReportChangesService } from './report-changes.service';
import { BehaviorSubject, map } from "rxjs";
import { NotificationService } from "../notification/notification/notification.service";
import { Reference } from "../domain/reference";

describe('ReportChangesService', () => {
  let service: ReportChangesService;
  let mockNotificationService: Partial<NotificationService>;

  let activeReports: BehaviorSubject<string[]>;

  beforeEach(async () => {
    activeReports = new BehaviorSubject<string[]>([]);
    mockNotificationService = {
      activeReports: () => activeReports.asObservable()
        .pipe(map(reportIds => reportIds.map(id => new Reference(id)))),
      triggerNotification: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportChangesService, {provide: NotificationService, useValue: mockNotificationService}],
    }).compile();

    service = module.get<ReportChangesService>(ReportChangesService);
  });

  it('should trigger notification after adding active report through NotificationService', (done) => {
    const testReportId = "report1";
    activeReports.next([testReportId]);

    // TODO mock a couchDbService.changes event

    (mockNotificationService.triggerNotification as jest.Mock).mockImplementation((reportId: string) => {
      expect(reportId).toBe(testReportId);
      done();
    });
  });

  it('should trigger notification after adding active report through NotificationService', async () => {
    activeReports.next(["report1"]);
    activeReports.next(["report2" /* removed report1 */]);

    // TODO mock a couchDbService.changes event

    await new Promise(process.nextTick); // wait for any async operations to finish
    expect(mockNotificationService.triggerNotification).not.toHaveBeenCalledWith("report1");
    expect(mockNotificationService.triggerNotification).toHaveBeenCalledWith("report2");
  });
});
