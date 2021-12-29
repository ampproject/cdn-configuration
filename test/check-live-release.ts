import assert from 'assert';
import minimist, {ParsedArgs} from 'minimist';
import versionsJson from '../configs/versions.json';
import fetch from 'node-fetch';

interface Args extends ParsedArgs {
  diff?: string;
}
const {diff}: Args = minimist(process.argv.slice(2));
const files: string[] = diff ? diff.split(' ') : [];

// TODO(estherkim): unskip when versions.json is used in prod
describe.skip('check releases are live before promoting', function () {
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
      const url = `https://cdn.ampproject.org/rtv/${version}/v0.js`;
      const response = await fetch(url, {method: 'GET'});
      assert.equal(response.status, 200, response.statusText);
    });
  });
});
