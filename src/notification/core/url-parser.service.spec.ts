import { Test, TestingModule } from '@nestjs/testing';
import { UrlParser } from './url-parser.service';

describe('UrlParserService', () => {
  let service: UrlParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UrlParser],
    }).compile();

    service = module.get<UrlParser>(UrlParser);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should replace a path argument', () => {
    const url = 'https://aam.internal/foo/bar/<reportId>/doo';

    const target = service.replacePlaceholder(url, {
      reportId: '123',
    });

    expect(target).toEqual('https://aam.internal/foo/bar/123/doo');
  });

  it('should replace multiple path arguments', () => {
    const url = 'https://aam.internal/<apiVersion>/bar/<reportId>/doo';

    const target = service.replacePlaceholder(url, {
      reportId: '123',
      apiVersion: 'v1',
    });

    expect(target).toEqual('https://aam.internal/v1/bar/123/doo');
  });

  it('should return all placeholder from url', () => {
    const url = 'https://aam.internal/<apiVersion>/bar/<reportId>/doo';

    const target: string[] = service.getPlaceholder(url);

    expect(target).toStrictEqual(['<apiVersion>', '<reportId>']);
  });
});
