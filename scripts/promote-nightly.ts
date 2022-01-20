/**
 * Promotes a nightly release.
 */

import yargs from 'yargs/yargs';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

const jobName = 'promote-nightly.ts';
const {amp_version: AMP_VERSION} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string', demandOption: true}})
  .parseSync();

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest(() => ({
    versionsChanges: {nightly: `04${AMP_VERSION}`},
    title: `⏫🌙 Promoting release ${AMP_VERSION} to Nightly channel`,
    body: `Promoting release ${AMP_VERSION} to Nightly channel`,
    branch: `nightly-${AMP_VERSION}`,
  }));
});
