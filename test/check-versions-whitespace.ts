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
      'The format of versions.json is incorrect, see resulting diff for expected format. The format is strictly enforced to prevent Git merge conflicts in multiple parallel auto-generated PRs that modify disparate channels.'
    );
  });
});
