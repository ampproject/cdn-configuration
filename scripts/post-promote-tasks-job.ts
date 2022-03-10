import yargs from 'yargs/yargs';
import {getVersionDiff} from './post-promote-tasks-utils';

const {head, base} = yargs(process.argv.slice(2))
  .options({
    head: {type: 'string', demandOption: true},
    base: {type: 'string', demandOption: true},
  })
  .parseSync();

interface TaskConfig {
  [channel: string]: string;
}

//TODO(estherkim): add release tagger tasks
const PUBLISH_NPM: TaskConfig = {
  nightly: 'nightly',
  stable: 'latest',
};

const RELEASE_CALENDAR: TaskConfig = {
  nightly: 'nightly',
  'beta-traffic': 'beta',
  stable: 'stable',
  lts: 'lts',
};

async function setOutput() {
  const versionDiff = await getVersionDiff(head, base);
  const npm: {'amp-version': string; tag: string}[] = [];
  const calendar: {'amp-version': string; channel: string}[] = [];

  versionDiff.forEach(({channel, version}) => {
    if (PUBLISH_NPM[channel]) {
      npm.push({'amp-version': version, tag: PUBLISH_NPM[channel]});
    }

    if (RELEASE_CALENDAR[channel]) {
      calendar.push({
        'amp-version': version,
        channel: RELEASE_CALENDAR[channel],
      });
    }
  });

  process.stdout.write(JSON.stringify({npm, calendar}));
}

void setOutput();
