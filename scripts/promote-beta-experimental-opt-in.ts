/**
 * Promotes a Beta/Experimental opt-in release.
 */

import yargs from 'yargs/yargs';
import {
  createVersionsUpdatePullRequest,
  isForwardPromote,
  runPromoteJob,
} from './promote-job';

const jobName = 'promote-beta-experimental-opt-in.ts';
const {amp_version: AMP_VERSION} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string'}})
  .parseSync();

void runPromoteJob(jobName, () => {
  return createVersionsUpdatePullRequest((currentVersions) => {
    const ampVersion = AMP_VERSION || currentVersions.nightly.slice(2);

    // for scheduled promotions, check that the new version is a forward promote
    if (!AMP_VERSION) {
      if (
        !isForwardPromote(ampVersion, [
          currentVersions['beta-opt-in'],
          currentVersions['beta-traffic'],
          currentVersions.stable,
          currentVersions.lts,
        ])
      ) {
        throw new Error(
          'The scheduled promotion is older than current versions. This is most likely due to a stale nightly branch.'
        );
      }
    }

    return {
      ampVersion,
      versionsChanges: {
        'beta-opt-in': `03${ampVersion}`,
        'experimental-opt-in': `00${ampVersion}`,
      },
      title: `⏫ Promoting release ${ampVersion} to Beta/Experimental opt-in channel`,
      body: `Promoting release ${ampVersion} from Nightly channel to Beta/Experimental opt-in channel`,
      branch: `beta-experimental-opt-in-${ampVersion}`,
    };
  });
});
