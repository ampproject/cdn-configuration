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

    assert.equal(
      versionsJsonString,
      expectedVersionsJsonString,
      'The format of versions.json is incorrect, there must be an empty line between each channel name. This format is enforced to prevent Git merge conflicts in automated PRs.'
    );
  });
});
