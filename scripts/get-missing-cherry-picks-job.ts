import yargs from 'yargs/yargs';
import {Octokit} from '@octokit/rest';
import currentVersions from '../configs/versions.json';
import {getMissingCommits} from './get-missing-cherry-picks-utils';
import * as core from '@actions/core';

const {amp_version: AMP_VERSION} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string'}})
  .parseSync();

async function setOutput() {
  const ampVersion = AMP_VERSION || currentVersions.nightly.slice(2);

  const releases = new Set(
    [
      currentVersions.lts,
      currentVersions.stable,
      currentVersions['beta-traffic'],
    ].map((rtv) => rtv.slice(-13))
  );

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const commits = await getMissingCommits(octokit, ampVersion, releases);
  if (commits.length > 0) {
    core.setOutput('fixes', commits.join(' '));
  }
}

void setOutput();
