/**
 * Promotes a nightly release.
 */

import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

const jobName = 'promote-nightly.js';
const {AMP_VERSION} = process.env;

void runPromoteJob(jobName, async () => {
  if (!AMP_VERSION) {
    throw new Error('Environment variable AMP_VERSION is missing');
  }

  await createVersionsUpdatePullRequest(() => ({
    versionsChanges: {nightly: `04${AMP_VERSION}`},
    title: `⏫🌙 Promoting release ${AMP_VERSION} to Nightly channel`,
    body: `Promoting release ${AMP_VERSION} to Nightly channel`,
    branch: `nightly-${AMP_VERSION}`,
  }));
});
