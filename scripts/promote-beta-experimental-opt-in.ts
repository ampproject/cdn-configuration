/**
 * Promotes a Beta/Experimental opt-in release.
 */

import minimist, {ParsedArgs} from 'minimist';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

interface Args extends ParsedArgs {
  amp_version?: string;
}

const jobName = 'promote-beta-experimental-opt-in.ts';
const {amp_version: AMP_VERSION}: Args = minimist(process.argv.slice(2));

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest((currentVersions) => {
    const ampVersion = AMP_VERSION || currentVersions.nightly.slice(2);

    return {
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
