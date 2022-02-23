/**
 * Promotes cherry-picked release in related channels.
 */

import yargs from 'yargs/yargs';
import {Prefixes, Versions} from '../configs/schemas/versions';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';
import {getChannels} from './get-channels-utils';

interface Args {
  amp_version: string;
}
const {amp_version: ampVersion}: Args = yargs(process.argv.slice(2))
  .options({
    amp_version: {type: 'string', demandOption: true},
  })
  .parseSync();

const jobName = 'promote-cherry-pick.ts';
const ampVersionWithoutCherryPicksCounter = ampVersion.slice(0, 10);
const cherryPicksCount = ampVersion.slice(-3);

function getAmpVersionToCherrypick(
  ampVersion: string,
  currentVersions: Versions
): string {
  const ampVersionToCherrypick = Object.values(currentVersions).find(
    (version) =>
      version?.slice(2, 12) == ampVersionWithoutCherryPicksCounter &&
      version?.slice(0, 2) < cherryPicksCount
  );
  if (!ampVersionToCherrypick) {
    throw Error(
      `Could not find a live AMP version to be cherry-picked with ${ampVersion}`
    );
  }
  return ampVersionToCherrypick.slice(-13);
}

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest((currentVersions) => {
    const currentAmpVersion = getAmpVersionToCherrypick(
      ampVersion,
      currentVersions
    );
    const currentCherryPicksCount = currentAmpVersion.slice(-3);
    const channels = getChannels(currentAmpVersion, currentVersions).join(', ');
    const versionsChanges: {[channel: string]: string} = {};
    for (const channel of channels) {
      versionsChanges[channel] = `${Prefixes[channel]}${ampVersion}`;
    }

    return {
      versionsChanges,
      title: `🌸 Promoting all ${ampVersionWithoutCherryPicksCounter}[${currentCherryPicksCount}→${cherryPicksCount}] channels`,
      body: `Promoting release ${ampVersion} to channels: ${channels}`,
      branch: `cherry-pick-${currentAmpVersion}-to-${ampVersion}`,
    };
  });
});
