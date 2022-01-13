/**
 * Promotes a Stable release.
 */

import minimist, {ParsedArgs} from 'minimist';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

interface Args extends ParsedArgs {
  amp_version?: string;
}

const jobName = 'promote-stable.ts';
const {amp_version: AMP_VERSION}: Args = minimist(process.argv.slice(2));

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest((currentVersions) => {
    // We assume that the AMP version number is the same for beta-traffic and experimental-traffic, and only differ in their RTV prefix.
    const ampVersion = AMP_VERSION || currentVersions['beta-traffic'].slice(2);

    return {
      versionsChanges: {
        stable: `01${ampVersion}`,
        control: `02${ampVersion}`,
        'nightly-control': `05${ampVersion}`,
      },
      title: `⏫ Promoting release ${ampVersion} to Stable channel`,
      body: `Promoting release ${ampVersion} from Beta/Experimental Traffic channel to Stable channel`,
      branch: `stable-${ampVersion}`,
    };
  });
});
