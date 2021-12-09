import assert from 'assert';
import {checkVersionPattern, versions} from '../src/check-configs';

describe('check versions.json', () => {
  const channels = Object.keys(versions);
  channels.forEach(channel => {
    it(channel, () => {
      assert.ok(checkVersionPattern(channel));
    })
  })
});
