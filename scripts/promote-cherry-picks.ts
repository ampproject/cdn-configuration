/**
 * Promotes cherry-picked release in related channels.
 */

import yargs from 'yargs/yargs';
import {Prefixes, Versions} from '../configs/schemas/versions';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

interface Args {
  amp_version: string;
}
const {amp_version: ampVersion}: Args = yargs(process.argv.slice(2))
  .options({
    amp_version: {type: 'string', demandOption: true},
  })
  .parseSync();

const jobName = 'promote-cherry-pick.ts';

function getOldAmpVersion(
  ampVersion: string,
  currentVersions: Versions
): string {
  const firstTen = ampVersion.slice(0, 10);
  const oldVersion = Object.values(currentVersions).find(
    (version) => version?.slice(2, 12) == firstTen
  );
  if (!oldVersion) {
    throw Error(
      `Could not find a live AMP version to be cherry-picked with ${ampVersion}`
    );
  }
  return oldVersion.slice(-13);
}

function getChannels(ampVersion: string, currentVersions: Versions): string[] {
  const channels = [];
  for (const [channel, version] of Object.entries(currentVersions)) {
    if (version && version.slice(-13) == ampVersion) {
      channels.push(channel);
    }
  }
  return channels;
}

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest((currentVersions) => {
    const oldAmpVersion = getOldAmpVersion(ampVersion, currentVersions);
    const channels = getChannels(oldAmpVersion, currentVersions);
    const versionsChanges: {[channel: string]: string} = {};
    for (const channel of channels) {
      versionsChanges[channel] = `${Prefixes[channel]}${ampVersion}`;
    }

    return {
      versionsChanges,
      title: `🌸 Promoting all ${oldAmpVersion.slice(
        0,
        10
      )}[${oldAmpVersion.slice(-3)}→${ampVersion.slice(-3)}] channels`,
      body: `Promoting release ${ampVersion} to channels: ${channels.join(
        ', '
      )}`,
      branch: `cherry-pick-${oldAmpVersion}-to-${ampVersion}`,
    };
  });
});
