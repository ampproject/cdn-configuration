import yargs from 'yargs/yargs';
import {Octokit} from '@octokit/rest';
import currentVersions from '../configs/versions.json';
import {getMissingCommits} from './get-missing-cherry-picks-utils';

const {amp_version: ampVersion} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string', demandOption: true}})
  .parseSync();

async function setOutput() {
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
