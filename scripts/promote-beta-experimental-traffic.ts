/**
 * Promotes a Beta/Experimental traffic release.
 */

import minimist, {ParsedArgs} from 'minimist';
import {
  createVersionsUpdatePullRequest,
  octokit,
  runPromoteJob,
} from './promote-job';

interface Args extends ParsedArgs {
  amp_version?: string;
}

type ExperimentConfig = {
  // ExperimentConfig has other fields, but here we only care about one:
  define_experiment_constant?: string;
};

type ExperimentsConfig = {
  experimentA: ExperimentConfig;
  experimentB: ExperimentConfig;
  experimentC: ExperimentConfig;
};

const jobName = 'promote-beta-experimental-traffic.ts';
const {amp_version: AMP_VERSION}: Args = minimist(process.argv.slice(2));

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
  return experiment.define_experiment_constant ?? rtv;
}

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest(async (currentVersions) => {
    // We assume that the AMP version number is the same for beta-opt-in and experimental-opt-in, and only differ in their RTV prefix.
    const ampVersion = AMP_VERSION ?? currentVersions['beta-opt-in'].slice(2);

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
