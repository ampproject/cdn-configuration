import assert from 'assert';
import minimist from 'minimist';

const {diff} = minimist(process.argv.slice(2));
const files: string[] = diff ? diff.split(' ') : [];

describe('check file changes', () => {
  it('should not update more than one config at a time', () => {
    const changes = files.filter(file => 
      file.startsWith('configs/') && file.endsWith('.json')
    );
    assert.ok(
      changes.length <= 1,
      `Only 1 config change allowed at a time. Found ${changes.length}: ${changes.join(', ')}`)
  })
})
