import assert from 'assert';
import yargs from 'yargs/yargs';
import versionsJson from '../configs/versions.json';
import fetch from 'node-fetch';

const {diff} = yargs(process.argv.slice(2))
  .options({diff: {type: 'string', demandOption: true}})
  .parseSync();
const files = diff.split(' ');

describe('check releases are live before promoting', function () {
  const versionChannels = new Map<string, string[]>();
  for (const [channel, version] of Object.entries(versionsJson)) {
    if (version) {
      const x = versionChannels.get(version) || [];
      x.push(channel);
      versionChannels.set(version, x);
    }
  }

  before(function () {
    const change = files.some((file) => file.includes('configs/versions.json'));
    if (!change) {
      this.skip();
    }
  });

  versionChannels.forEach((channels, version) => {
    it(`${version} (${channels.sort().join(', ')})`, async () => {
      const url = `https://ampjs.org/rtv/${version}/v0.js`;
      const response = await fetch(url, {method: 'GET'});
      assert.equal(response.status, 200, response.statusText);
    });
  });
});
