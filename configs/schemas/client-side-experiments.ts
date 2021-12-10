import { JSONSchemaType } from 'ajv';

interface Experiment {
  name: string,
  percentage: number,
  rtvPrefixes: string[],
};

interface Schema {
  experiments: Experiment[]
}

const schema: JSONSchemaType<Schema> = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  description: 'Client-side (AMP_EXP) experiment definitions',
  type: 'object',
  required: [
    'experiments'
  ],
  properties: {
    experiments: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'name',
          'percentage'
        ],
        properties: {
          name: {
            type: 'string',
            pattern: '^[A-Za-z][\\w-]*$'
          },
          percentage: {
              type: 'number',
              minimum: 0,
              maximum: 1
          },
          rtvPrefixes: {
            type: 'array',
            items: {
              type: 'string',
              pattern: '^[\\d\\.]+$'
            }
          }
        }
      }
    }
  },
  additionalProperties: false
}

export default schema;
