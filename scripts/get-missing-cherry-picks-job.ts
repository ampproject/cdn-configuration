import yargs from 'yargs/yargs';
import {Octokit} from '@octokit/rest';
import currentVersions from '../configs/versions.json';
import {getMissingCommits} from './get-missing-cherry-picks-utils';

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

  const commits = await getMissingCommits(new Octokit(), ampVersion, releases);
  if (commits.length > 0) {
    process.stdout.write(commits.join(' '));
  }
}

void setOutput();
