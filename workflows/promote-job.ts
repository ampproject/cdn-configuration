import fs from 'fs-extra';
import {cyan, green, red} from 'kleur';
import {createPullRequest} from 'octokit-plugin-create-pull-request';
import {Octokit} from '@octokit/rest';

const octokit = new (Octokit.plugin(createPullRequest))({
  auth: process.env.GITHUB_TOKEN,
});

const versionsJsonFile = 'configs/versions.json';
const params = {owner: 'ampproject', repo: 'cdn-configuration'};

// TODO(danielrozenberg): change to @ampproject/release-on-duty after testing is done.
const releaseOnDuty = '@ampproject/wg-infra';

type Versions = Record<string, string | null>;
type CreatePullRequestResponsePromise = ReturnType<
  typeof octokit.createPullRequest
>;

interface VersionMutatorDef {
  versionsChanges: Versions;
  title: string;
  body: string;
}

function timeExecutionTime_(startTime: number): string {
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  const mins = Math.floor(executionTime / 60000);
  const secs = Math.floor((executionTime % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * Helper used by promote related CI job scripts.
 */
export async function runPromoteJob(
  jobName: string,
  workflow: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  console.log('Running', cyan(jobName) + '...');
  try {
    await workflow();
    console.log(
      'Done running',
      cyan(jobName),
      'Total time:',
      green(timeExecutionTime_(startTime))
    );
  } catch (err) {
    console.error(
      red('Job'),
      cyan(jobName) + red('failed after'),
      green(timeExecutionTime_(startTime))
    );
    console.error(red('ERROR:'), err);
  }
}

/**
 * Creates a pull request to update versions.json.
 */
export async function createVersionsUpdatePullRequest(
  versionsMutator: (currentVersions: Versions) => VersionMutatorDef
): CreatePullRequestResponsePromise {
  if (!process.env.GITHUB_RUN_ID) {
    throw new Error('Environment variable GITHUB_RUN_ID is missing');
  }

  const currentVersions = (await fs.readJson(
    versionsJsonFile,
    'utf8'
  )) as Versions;
  const {body, title, versionsChanges} = versionsMutator(currentVersions);

  const newVersions: Versions = {
    ...currentVersions,
    ...versionsChanges,
  };

  const pullRequestResponse = await octokit.createPullRequest({
    ...params,
    title,
    body: `${body}\n\n${releaseOnDuty}`,
    head: `promote-job-${process.env.GITHUB_RUN_ID}`,
    changes: [
      {
        files: {
          [versionsJsonFile]: JSON.stringify(newVersions, undefined, 2) + '\n',
        },
        commit: title,
      },
    ],
    createWhenEmpty: false,
  });

  if (!pullRequestResponse || pullRequestResponse.status !== 201) {
    throw new Error('Failed to create a pull request');
  }

  return pullRequestResponse;
}
