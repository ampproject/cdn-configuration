import * as core from '@actions/core';
import yargs from 'yargs/yargs';
import {
  getVersionDiff,
  getBaseAmpVersion,
  getSha,
  getPullRequestDetails,
} from './post-promote-tasks-utils';

const {pull_number, override_pull_number} = yargs(process.argv.slice(2))
  .options({
    pull_number: {type: 'number', demandOption: true},
    override_pull_number: {type: 'number', demandOption: true},
  })
  .parseSync();

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

interface OutputCalendar {
  'amp-version': string;
  channel: string;
  time: string;
}

interface OutputTagger {
  action: string;
  head: string;
  base: string;
  channel: string;
  sha: string;
}

async function setOutput() {
  const pullNumber =
    override_pull_number > 0 ? override_pull_number : pull_number;
  if (!pullNumber) {
    return core.setFailed(
      `A pull request number is required. Given: pull_number: ${pull_number}; override_pull_number: ${override_pull_number}.`
    );
  }

  const details = await getPullRequestDetails(pullNumber);
  if (!details) {
    return core.setFailed(
      `Error getting merge_commit_sha and/or merged_at of PR #${pullNumber}. Check that this PR was merged.`
    );
  }

  const {head, base, title, time} = details;
  const versionDiff = await getVersionDiff(head, base);
  const calendar: OutputCalendar[] = [];
  const tagger: OutputTagger[] = [];

  for (const {channel, version} of versionDiff) {
    if (RELEASE_CALENDAR[channel]) {
      calendar.push({
        'amp-version': version,
        channel: RELEASE_CALENDAR[channel],
        time,
      });
    }

    if (RELEASE_TAGGER[channel]) {
      const {headChannel, baseChannel} = RELEASE_TAGGER[channel];
      const action =
        title.startsWith('Revert') && title.includes(version)
          ? 'rollback'
          : 'promote';
      const baseAmpVersion = await getBaseAmpVersion(version, baseChannel);
      const sha = await getSha(version);
      if (baseAmpVersion && sha) {
        tagger.push({
          action,
          head: version,
          base: baseAmpVersion,
          channel: headChannel,
          sha,
        });
      }
    }
  }

  core.setOutput('calendar', calendar.length > 0 ? {includes: calendar} : null);
  core.setOutput('tagger', tagger.length > 0 ? {includes: tagger} : null);
}

void setOutput();
