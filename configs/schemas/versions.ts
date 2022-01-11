import {JSONSchemaType} from 'ajv';

export type Versions = {
  'beta-opt-in': string;
  'beta-traffic': string;
  control: string;
  'experimental-opt-in': string;
  'experimental-traffic': string;
  experimentA: string | null;
  experimentB: string | null;
  experimentC: string | null;
  lts: string;
  nightly: string;
  'nightly-control': string;
  stable: string;
};

const schema: JSONSchemaType<Versions> = {
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
    'stable',
  ],
  properties: {
    'beta-opt-in': {
      type: 'string',
      pattern: '03\\d{13}',
    },
    'beta-traffic': {
      type: 'string',
      pattern: '03\\d{13}',
    },
    control: {
      type: 'string',
      pattern: '02\\d{13}',
    },
    'experimental-opt-in': {
      type: 'string',
      pattern: '03\\d{13}',
    },
    'experimental-traffic': {
      type: 'string',
      pattern: '03\\d{13}',
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
    lts: {
      type: 'string',
      pattern: '01\\d{13}',
    },
    nightly: {
      type: 'string',
      pattern: '04\\d{13}',
    },
    'nightly-control': {
      type: 'string',
      pattern: '05\\d{13}',
    },
    stable: {
      type: 'string',
      pattern: '01\\d{13}',
    },
  },
  additionalProperties: false,
};

export default schema;
