/**
 * Promotes an LTS release.
 */

import yargs from 'yargs/yargs';
import {
  createVersionsUpdatePullRequest,
  ensureForwardPromote,
  runPromoteJob,
} from './promote-job';

const jobName = 'promote-lts.ts';
const {amp_version: AMP_VERSION} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string'}})
  .parseSync();

void runPromoteJob(jobName, () => {
  return createVersionsUpdatePullRequest((currentVersions) => {
    const ampVersion = AMP_VERSION || currentVersions.stable.slice(2);

    // for scheduled promotions, check that the new version is a forward promote
    if (!AMP_VERSION) {
      ensureForwardPromote(ampVersion, [currentVersions.lts]);
    }

    return {
      ampVersion,
      versionsChanges: {
        lts: `01${ampVersion}`,
      },
      title: `⏫ Promoting release ${ampVersion} to LTS channel`,
      body: `Promoting release ${ampVersion} from Stable channel to LTS channel`,
      branch: `lts-${ampVersion}`,
    };
  });
});
