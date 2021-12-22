import assert from 'assert';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import versions from '../configs/versions.json';
import versionsSchema from '../configs/schemas/versions';
import clientSideExperiments from '../configs/client-side-experiments.json';
import clientSideExperimentsSchema from '../configs/schemas/client-side-experiments';
import freezedates from '../configs/freezedates.json';
import freezedatesSchema from '../configs/schemas/freezedates';

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
