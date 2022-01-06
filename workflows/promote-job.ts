import fs from 'fs-extra';
import {cyan, green, red} from 'kleur';
import {createPullRequest} from 'octokit-plugin-create-pull-request';
import {Octokit as BaseOctokit} from '@octokit/rest';

const Octokit = BaseOctokit.plugin(createPullRequest);
const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});

const versioningJsonFile = 'configs/versions.json';
const params = {owner: 'ampproject', repo: 'cdn-configuration'};

// TODO(danielrozenberg): change to @ampproject/release-on-duty after testing is done.
const releaseOnDuty = '@ampproject/wg-infra';

type Versioning = Record<string, string | null>;
type CreatePullRequestResponsePromise = ReturnType<
  typeof octokit.createPullRequest
>;

interface VersionMutatorDef {
  versioningChanges: Versioning;
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
 * Creates a pull request to update versioning.json.
 */
export async function createVersioningUpdatePullRequest(
  versioningMutator: (currentVersioning: Versioning) => VersionMutatorDef
): CreatePullRequestResponsePromise {
  if (!process.env.GITHUB_RUN_ID) {
    throw new Error('Environment variable GITHUB_RUN_ID is missing');
  }

  const currentVersioning = (await fs.readJson(
    versioningJsonFile,
    'utf8'
  )) as Versioning;
  const {body, title, versioningChanges} = versioningMutator(currentVersioning);

  const newVersioning: Versioning = {
    ...currentVersioning,
    ...versioningChanges,
  };

  const pullRequestResponse = await octokit.createPullRequest({
    ...params,
    title,
    body: `${body}\n\n${releaseOnDuty}`,
    head: `promote-job-${process.env.GITHUB_RUN_ID}`,
    changes: [
      {
        files: {
          [versioningJsonFile]:
            JSON.stringify(newVersioning, undefined, 2) + '\n',
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
