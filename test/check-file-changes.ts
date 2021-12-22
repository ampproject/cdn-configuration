import assert from 'assert';
import minimist, { ParsedArgs } from 'minimist';
import freezedatesJson from '../configs/freezedates.json';

interface Args extends ParsedArgs {
  diff?: string
}
const {diff}: Args = minimist(process.argv.slice(2));
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

  it('should not change `versions.json` during a freeze', () => {
    const change = files.some(file => 
      file.includes('configs/versions.json')
    );
    
    if (!change) {
      return;
    }

    let currentFreeze = null;
    const today = new Date(Date.now());

    for (const freezedate of freezedatesJson.freezedates) {
      const start = new Date(freezedate.start);
      const end = new Date(freezedate.end);

      if (start <= today && today <= end) {
        currentFreeze = freezedate;
        break;
      }
    }

    assert.ok(!currentFreeze, '`versions.json` cannot be changed during a release freeze: ' + JSON.stringify(currentFreeze))
  });
})
