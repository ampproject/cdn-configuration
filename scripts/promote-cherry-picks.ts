/**
 * Promotes cherry-picked release in related channels.
 */

import yargs from 'yargs/yargs';
import {Prefixes, Versions} from '../configs/schemas/versions';
import {
  createVersionsUpdatePullRequest,
  octokit,
  runPromoteJob,
} from './promote-job';
import {getChannels} from './get-channels-utils';
import {components} from '@octokit/openapi-types';

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

async function getCherryPickedPRs(
  ampVersion: string,
  numberOfCherryPickedCommits: number
): Promise<string[]> {
  try {
    const {data} = await octokit.rest.repos.listCommits({
      owner: 'ampproject',
      repo: 'amphtml',
      sha: ampVersion,
      per_page: numberOfCherryPickedCommits,
    });
    return data.map(({commit}) => {
      const [firstLine] = commit.message.split('\n');
      const pullNumber = firstLine?.match(/\(#(?<pullNumber>\d+)\)$/)?.groups
        ?.pullNumber;
      if (pullNumber) {
        return `* https://github.com/ampproject/amphtml/pull/${pullNumber}`;
      }
      // Ugh Octokit's typing is horrendous.
      const {html_url: htmlUrl} =
        commit as unknown as components['schemas']['commit'];
      return `* ${htmlUrl}`;
    });
  } catch (err) {
    console.warn('Could not fetch the list of cherry picked PRs, skipping...');
    console.warn('Exception thrown:', err);
    return [];
  }
}

function generateBody(
  ampVersion: string,
  channels: string,
  cherryPickedPRs: string[]
): string {
  let body = `Promoting release ${ampVersion} to channels: ${channels}`;
  if (cherryPickedPRs.length) {
    body += '\n\nPRs included in this cherry pick:\n';
    body += cherryPickedPRs.join('\n');
  }
  body += `\n\nCommits on release branch: [amp-release-${ampVersion}](https://github.com/ampproject/amphtml/commits/amp-release-${ampVersion})`;
  return body;
}

void runPromoteJob(jobName, async () => {
  return createVersionsUpdatePullRequest(async (currentVersions) => {
    const currentAmpVersion = getAmpVersionToCherrypick(
      ampVersion,
      currentVersions
    );
    const currentCherryPicksCount = currentAmpVersion.slice(-3);
    const channels = getChannels(currentAmpVersion, currentVersions);
    const versionsChanges: {[channel: string]: string} = {};
    for (const channel of channels) {
      versionsChanges[channel] = `${Prefixes[channel]}${ampVersion}`;
    }

    const cherryPickedPRs = await getCherryPickedPRs(
      ampVersion,
      Number(cherryPicksCount) - Number(currentCherryPicksCount)
    );

    return {
      ampVersion,
      versionsChanges,
      title: `🌸 Promoting all ${ampVersionWithoutCherryPicksCounter}[${currentCherryPicksCount}→${cherryPicksCount}] channels`,
      body: generateBody(ampVersion, channels.join(', '), cherryPickedPRs),
      branch: `cherry-pick-${currentAmpVersion}-to-${ampVersion}`,
    };
  });
});
