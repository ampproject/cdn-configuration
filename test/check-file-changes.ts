import assert from 'assert';
import minimist from 'minimist';

const {diff} = minimist(process.argv.slice(2));
const files = diff.split(' ');

describe('check file changes', () => {
  it('should not update more than one config at a time', () => {
    let changes = 0;
    for (const file of files) {
      if (file.endsWith('versions.json') || file.endsWith('client-side-experiments.json')) {
        changes ++;
      }
    }
    assert.ok(changes <= 1, `Found ${changes} updates`);
  })
})
