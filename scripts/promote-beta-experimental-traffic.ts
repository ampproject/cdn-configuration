/**
 * Promotes a Beta/Experimental traffic release.
 */

import yargs from 'yargs/yargs';
import {
  createVersionsUpdatePullRequest,
  octokit,
  runPromoteJob,
} from './promote-job';

type ExperimentConfig = {
  // ExperimentConfig has other fields, but here we only care about the following:
  expiration_date_utc?: string;
  define_experiment_constant?: string;
};

type ExperimentsConfig = {
  experimentA: ExperimentConfig;
  experimentB: ExperimentConfig;
  experimentC: ExperimentConfig;
};

const jobName = 'promote-beta-experimental-traffic.ts';
const {amp_version: AMP_VERSION} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string'}})
  .parseSync();

async function fetchActiveExperiments(
  ampVersion: string
): Promise<ExperimentsConfig> {
  const response = await octokit.repos.getContent({
    owner: 'ampproject',
    repo: 'amphtml',
    ref: ampVersion,
    path: 'build-system/global-configs/experiments-config.json',
  });
  if (!('content' in response.data)) {
    throw new Error(
      'Unexpected response when fetching experiments-config.json from ampproject/amphtml'
    );
  }

  return JSON.parse(
    Buffer.from(response.data.content, 'base64').toString()
  ) as ExperimentsConfig;
}

function maybeRtv(experiment: ExperimentConfig, rtv: string): string | null {
  const {define_experiment_constant, expiration_date_utc} = experiment;
  if (!define_experiment_constant || !expiration_date_utc) {
    return null;
  }

  // Regardless of when this job was run, experiments should still be available
  // if the base (pre any cherry-picks) AMP version was generated from a commit
  // on or before that experiment's expiration date. This is to prevent a
  // situation where an experiment suddenly gets turned off by a cherry-pick
  // that affects the traffic channels.
  const rtvDateStr = rtv.slice(2, 8);
  const expirationDateStr = expiration_date_utc.slice(2).replace(/-/g, '');
  if (expirationDateStr < rtvDateStr) {
    return null;
  }

  return rtv;
}

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest(async (currentVersions) => {
    // We assume that the AMP version number is the same for beta-opt-in and experimental-opt-in, and only differ in their RTV prefix.
    const ampVersion = AMP_VERSION || currentVersions['beta-opt-in'].slice(2);

    const activeExperiments = await fetchActiveExperiments(ampVersion);

    return {
      versionsChanges: {
        'beta-traffic': `03${ampVersion}`,
        'experimental-traffic': `00${ampVersion}`,
        experimentA: maybeRtv(activeExperiments.experimentA, `10${ampVersion}`),
        experimentB: maybeRtv(activeExperiments.experimentB, `11${ampVersion}`),
        experimentC: maybeRtv(activeExperiments.experimentC, `12${ampVersion}`),
      },
      title: `⏫ Promoting release ${ampVersion} to Beta/Experimental traffic channel`,
      body: `Promoting release ${ampVersion} from Nightly channel to Beta/Experimental traffic channel`,
      branch: `beta-experimental-traffic-${ampVersion}`,
    };
  });
});
