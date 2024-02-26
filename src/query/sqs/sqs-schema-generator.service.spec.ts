import { Test, TestingModule } from '@nestjs/testing';
import { SqsSchemaService } from './sqs-schema-generator.service';

describe('SchemaGeneratorService', () => {
  let service: SqsSchemaService;

  const entityConfig = {
    'entity:Child': {
      label: 'Child',
      labelPlural: 'Children',
      attributes: {
        address: {
          dataType: 'location',
          label: 'Address',
        },
        health_bloodGroup: {
          dataType: 'string',
          label: 'Blood Group',
        },
        religion: {
          dataType: 'string',
          label: 'Religion',
        },
        motherTongue: {
          dataType: 'string',
          label: 'Mother Tongue',
          description: 'The primary language spoken at home',
        },
        health_lastDentalCheckup: {
          dataType: 'date',
          label: 'Last Dental Check-Up',
        },
        birth_certificate: {
          dataType: 'file',
          label: 'Birth certificate',
        },
      },
    },
    'entity:School': {
      attributes: {
        name: {
          dataType: 'string',
          label: 'Name',
        },
        privateSchool: {
          dataType: 'boolean',
          label: 'Private School',
        },
        language: {
          dataType: 'string',
          label: 'Language',
        },
        address: {
          dataType: 'location',
          label: 'Address',
        },
        phone: {
          dataType: 'string',
          label: 'Phone Number',
        },
        timing: {
          dataType: 'string',
          label: 'School Timing',
        },
        remarks: {
          dataType: 'string',
          label: 'Remarks',
        },
      },
    },
    'entity:HistoricalEntityData': {
      attributes: {
        isMotivatedDuringClass: {
          dataType: 'configurable-enum',
          additional: 'rating-answer',
          label: 'Motivated',
          description: 'The child is motivated during the class.',
        },
        isParticipatingInClass: {
          dataType: 'configurable-enum',
          additional: 'rating-answer',
          label: 'Participating',
          description: 'The child is actively participating in the class.',
        },
        isInteractingWithOthers: {
          dataType: 'configurable-enum',
          additional: 'rating-answer',
          label: 'Interacting',
          description:
            'The child interacts with other students during the class.',
        },
        doesHomework: {
          dataType: 'configurable-enum',
          additional: 'rating-answer',
          label: 'Homework',
          description: 'The child does its homework.',
        },
        asksQuestions: {
          dataType: 'configurable-enum',
          additional: 'rating-answer',
          label: 'Asking Questions',
          description: 'The child is asking questions during the class.',
        },
      },
    },
    'entity:User': {
      attributes: {
        phone: {
          dataType: 'string',
          label: 'Contact',
        },
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SqsSchemaService],
    }).compile();

    service = module.get<SqsSchemaService>(SqsSchemaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
