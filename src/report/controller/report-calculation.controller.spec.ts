import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculationController } from './report-calculation.controller';

describe('ReportCalculationController', () => {
  let controller: ReportCalculationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportCalculationController],
    }).compile();

    controller = module.get<ReportCalculationController>(ReportCalculationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
