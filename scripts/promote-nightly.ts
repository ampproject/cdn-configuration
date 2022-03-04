/**
 * Promotes a nightly release.
 */

import yargs from 'yargs/yargs';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

const jobName = 'promote-nightly.ts';
const {amp_version: ampVersion} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string', demandOption: true}})
  .parseSync();

void runPromoteJob(jobName, () => {
  return createVersionsUpdatePullRequest(() => ({
    ampVersion,
    versionsChanges: {nightly: `04${ampVersion}`},
    title: `⏫🌙 Promoting release ${ampVersion} to Nightly channel`,
    body: `Promoting release ${ampVersion} to Nightly channel`,
    branch: `nightly-${ampVersion}`,
  }));
});
