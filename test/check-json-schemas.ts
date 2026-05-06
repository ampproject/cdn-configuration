import assert from 'assert';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {describe, it} from 'mocha';

import clientSideExperiments from '../configs/client-side-experiments.json';
import freezedates from '../configs/freezedates.json';
import clientSideExperimentsSchema from '../configs/schemas/client-side-experiments';
import freezedatesSchema from '../configs/schemas/freezedates';
import versionsSchema from '../configs/schemas/versions';
import versions from '../configs/versions.json';

describe('check json schemas', () => {
  const ajv = new Ajv();
  addFormats(ajv, ['date']);

  it('versions.json', () => {
    const validate = ajv.compile(versionsSchema);
    validate(versions);
    assert.equal(validate.errors, null);
  });

  it('client-side-experiments.json', () => {
    const validate = ajv.compile(clientSideExperimentsSchema);
    validate(clientSideExperiments);
    assert.equal(validate.errors, null);
  });

  it('freezedates.json', () => {
    const validate = ajv.compile(freezedatesSchema);
    validate(freezedates);
    assert.equal(validate.errors, null);
  });
});
