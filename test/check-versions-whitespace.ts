import assert from 'assert';
import fs from 'fs';
import path from 'path';

const versionsFilePath = path.join(__dirname, '../configs/versions.json');

describe('check versions.json whitespace', () => {
  it('whitespace exists', () => {
    const versionsJsonString = fs.readFileSync(versionsFilePath, 'utf-8');

    const expectedVersionsJsonString =
      JSON.stringify(JSON.parse(versionsJsonString), undefined, 2).replace(
        /,\n/g,
        ',\n\n'
      ) + '\n';

    assert.equal(versionsJsonString, expectedVersionsJsonString);
  });
});
