/**
 * Promotes an LTS release.
 */

import minimist, {ParsedArgs} from 'minimist';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

interface Args extends ParsedArgs {
  amp_version?: string;
}

const jobName = 'promote-lts.ts';
const {amp_version: AMP_VERSION}: Args = minimist(process.argv.slice(2));

void runPromoteJob(jobName, async () => {
  const dayOfMonth = new Date().getUTCDate();
  if (!AMP_VERSION && !(8 <= dayOfMonth && dayOfMonth <= 14)) {
    // Skip this job if today is not the 2nd Monday of the month. The 2nd Monday
    // always falls between the 8th to the 14th of the month (inclusive).
    console.log(
      'Automated LTS promote only occur on the 2nd Monday of each month. Skipping...'
    );
    return;
  }

  await createVersionsUpdatePullRequest((currentVersions) => {
    const ampVersion = AMP_VERSION || currentVersions.stable.slice(2);

    return {
      versionsChanges: {
        lts: `01${ampVersion}`,
      },
      title: `⏫ Promoting release ${ampVersion} to LTS channel`,
      body: `Promoting release ${ampVersion} from Stable channel to LTS channel`,
      branch: `lts-${ampVersion}`,
    };
  });
});
