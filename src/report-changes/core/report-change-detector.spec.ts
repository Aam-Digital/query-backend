import { EntityDoc, ReportChangeDetector } from './report-change-detector';
import { Report } from '../../domain/report';
import { DocChangeDetails } from './report-changes.service';

describe('ReportChangeDetector', () => {
  function testReportChangeDetection(
    sqlStatement: string,
    testCases: [EntityDoc, boolean][],
  ) {
    const report: Partial<Report> = {
      id: 'test-report-id',
      mode: 'sql',
      queries: [sqlStatement],
    };
    const service = new ReportChangeDetector(report as Report);

    for (const [newDoc, expectedResult] of testCases) {
      const mockedDocChange: DocChangeDetails = {
        change: {
          id: newDoc._id,
          changes: [],
          seq: '',
        },
        new: newDoc,
        previous: newDoc,
      };
      expect(service.affectsReport(mockedDocChange)).toBe(expectedResult);
    }
  }

  it('should detect doc change that triggers report change for basic "SELECT *" report', () => {
    testReportChangeDetection('SELECT * FROM EventNote', [
      [{ _id: 'EventNote:1' }, true],
      [{ _id: 'Event:1' }, false],
    ]);
  });

  it('should detect only docs used in SELECT clause are relevant', () => {
    testReportChangeDetection('SELECT name FROM EventNote', [
      [{ _id: 'EventNote:1', name: 'foo' }, true],
      [{ _id: 'EventNote:field-missing' }, false], // TODO: not implemented yet
      [{ _id: 'Event:other-type', name: 'foo' }, false],
    ]);
  });

  it('should detect only docs with previous or new value of field matching WHERE clause are relevant', () => {
    testReportChangeDetection(
      "SELECT * FROM EventNote WHERE location='Berlin'",
      [
        [{ _id: 'EventNote:1', location: 'Berlin' }, true],
        [{ _id: 'EventNote:field-not-matching', location: 'New York' }, false], // TODO: not implemented yet
        [{ _id: 'EventNote:field-missing' }, false],
        [{ _id: 'Event:other-type', location: 'Berlin' }, false],
      ],
    );
  });

  it('should detect fields in joins and complex json properties', () => {
    testReportChangeDetection(
      "SELECT c.name as Name, AttStatus as Status FROM Child c JOIN (SELECT json_extract(att.value, '$[0]') AS attendanceChildId, json_extract(att.value, '$[1].status') AS AttStatus FROM EventNote e, json_each(e.childrenAttendance) att) ON attendanceChildId=c._id",
      [
        // TODO
        [{ _id: 'EventNote:1' }, true],
        [{ _id: 'Child:1' }, true],
      ],
    );
  });
});
