import { JSONSchemaType } from 'ajv';

interface FreezeDate {
  type: string,
  description: string,
  start: string,
  end: string
}

interface Schema {
  freezedates: FreezeDate[]
}

const schema: JSONSchemaType<Schema> = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  description: 'Client-side (AMP_EXP) experiment definitions',
  type: 'object',
  required: [
    'freezedates'
  ],
  properties: {
    freezedates: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'start',
          'end'
        ],
        properties: {
          type: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          start: {
            type: 'string',
            format: 'date'
          },
          end: {
            type: 'string',
            format: 'date'
          }
        }
      }
    }
  },
  additionalProperties: false
}

export default schema;
