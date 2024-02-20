import { ReportSchemaGenerator } from './report-schema-generator';

describe('ReportChangeDetector', () => {
  const service = new ReportSchemaGenerator();

  it('should detect fields in simple SELECT statement', () => {
    const result = service.getTableNamesByQueries([
      'SELECT c.name as Name, c.dateOfBirth as DateOfBirth, c.gender as Gender FROM Child c',
    ]);

    expect(result).toStrictEqual([['Name', 'DateOfBirth', 'Gender']]);
  });

  it('should detect fields in multiple simple SELECT statements', () => {
    const result = service.getTableNamesByQueries([
      'SELECT c.name as Name, c.dateOfBirth as DateOfBirth, c.gender as Gender FROM Child c',
      'SELECT c.foo as Foo, c.bar as Bar, c.doo as Doo FROM Child c',
    ]);

    expect(result).toStrictEqual([
      ['Name', 'DateOfBirth', 'Gender'],
      ['Foo', 'Bar', 'Doo'],
    ]);
  });
});
