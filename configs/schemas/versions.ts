import { JSONSchemaType } from 'ajv';

interface Schema {
  [channel: string]: string | null;
}

const schema: JSONSchemaType<Schema> = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  description: 'Versioning (RTV) information',
  type: 'object',
  required: [
    'beta-opt-in',
    'beta-traffic',
    'control',
    'experimental-opt-in',
    'experimental-traffic',
    'experimentA',
    'experimentB',
    'experimentC',
    'lts',
    'nightly',
    'nightly-control',
    'stable'
  ],
  properties: {
    control: {
      type: 'string',
      pattern: '02\\d{13}',
    },
    experimentA: {
      type: 'string',
      pattern: '10\\d{13}',
      nullable: true,
    },
    experimentB: {
      type: 'string',
      pattern: '11\\d{13}',
      nullable: true,
    },
    experimentC: {
      type: 'string',
      pattern: '12\\d{13}',
      nullable: true,
    },
    nightly: {
      type: 'string',
      pattern: '04\\d{13}',
    },
    'nightly-control': {
      type: 'string',
      pattern: '05\\d{13}',
    },
  },
  patternProperties: {
    'beta-(opt-in|traffic)': {
      type: 'string',
      pattern: '03\\d{13}'
    },
    'experimental-(opt-in|traffic)': {
      type: 'string',
      pattern: '00\\d{13}'
    },
    '(stable|lts)': {
      type: 'string',
      pattern: '01\\d{13}'
    }
  },
  additionalProperties: false
};

export default schema;
