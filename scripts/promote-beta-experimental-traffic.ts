/**
 * Promotes a Beta/Experimental traffic release.
 */

import minimist, {ParsedArgs} from 'minimist';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

interface Args extends ParsedArgs {
  amp_version?: string;
}

const jobName = 'promote-beta-experimental-traffic.ts';
const {amp_version: AMP_VERSION}: Args = minimist(process.argv.slice(2));

async function rtvExists(rtv: string): Promise<string | null> {
  const response = await fetch(`http://cdn.ampproject.org/rtv/${rtv}/v0.js`);
  return response.ok ? rtv : null;
}

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest(async (currentVersions) => {
    // We assume that the AMP version number is the same for beta-opt-in and experimental-opt-in, and only differ in their RTV prefix.
    const ampVersion = AMP_VERSION ?? currentVersions['beta-opt-in'].slice(2);

    return {
      versionsChanges: {
        'beta-traffic': `03${ampVersion}`,
        'experimental-traffic': `00${ampVersion}`,
        experimentA: await rtvExists(`10${ampVersion}`),
        experimentB: await rtvExists(`11${ampVersion}`),
        experimentC: await rtvExists(`12${ampVersion}`),
      },
      title: `⏫ Promoting release ${ampVersion} to Beta/Experimental traffic channel`,
      body: `Promoting release ${ampVersion} from Nightly channel to Beta/Experimental traffic channel`,
      branch: `beta-experimental-traffic-${ampVersion}`,
    };
  });
});
