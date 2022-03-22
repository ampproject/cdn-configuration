import * as core from '@actions/core';
import yargs from 'yargs/yargs';
import {getVersionDiff, getBaseAmpVersion} from './post-promote-tasks-utils';

const {head, base} = yargs(process.argv.slice(2))
  .options({
    head: {type: 'string', demandOption: true},
    base: {type: 'string', demandOption: true},
  })
  .parseSync();

const PUBLISH_NPM: {[channel: string]: string} = {
  nightly: 'nightly',
  stable: 'latest',
};

const RELEASE_CALENDAR: {[channel: string]: string} = {
  nightly: 'nightly',
  'beta-traffic': 'beta',
  stable: 'stable',
  lts: 'lts',
};

const RELEASE_TAGGER: {[channel: string]: Record<string, string>} = {
  'beta-opt-in': {
    headChannel: 'beta-opt-in',
    baseChannel: 'stable',
  },
  'beta-traffic': {
    headChannel: 'beta-percent',
    baseChannel: 'stable',
  },
  stable: {
    headChannel: 'stable',
    baseChannel: 'stable',
  },
  lts: {
    headChannel: 'lts',
    baseChannel: 'lts',
  },
};

async function setOutput() {
  const versionDiff = await getVersionDiff(head, base);
  const npm: {'amp-version': string; tag: string}[] = [];
  const calendar: {'amp-version': string; channel: string}[] = [];
  const tagger: {
    action: string;
    head: string;
    base: string;
    channel: string;
  }[] = [];

  for (const {channel, version} of versionDiff) {
    if (PUBLISH_NPM[channel]) {
      npm.push({'amp-version': version, tag: PUBLISH_NPM[channel]});
    }

    if (RELEASE_CALENDAR[channel]) {
      calendar.push({
        'amp-version': version,
        channel: RELEASE_CALENDAR[channel],
      });
    }

    if (RELEASE_TAGGER[channel]) {
      const {headChannel, baseChannel} = RELEASE_TAGGER[channel];
      const baseAmpVersion = await getBaseAmpVersion(version, baseChannel);
      if (baseAmpVersion) {
        tagger.push({
          action: 'promote', // TODO(estherkim): support rollbacks
          head: version,
          base: baseAmpVersion,
          channel: headChannel,
        });
      }
    }
  }

  core.setOutput('npm', npm.length > 0 ? {includes: npm} : null);
  core.setOutput('calendar', calendar.length > 0 ? {includes: calendar} : null);
  core.setOutput('tagger', tagger.length > 0 ? {includes: tagger} : null);
}

void setOutput();
