import {createPullRequest} from 'octokit-plugin-create-pull-request';
import {Octokit} from '@octokit/rest';
import {Versions} from '../configs/schemas/versions';
import currentVersions from '../configs/versions.json';
import yargs from 'yargs/yargs';

export const octokit = new (Octokit.plugin(createPullRequest))({
  auth: process.env.ACCESS_TOKEN,
});

const versionsJsonFile = 'configs/versions.json';
const params = {owner: 'ampproject', repo: 'cdn-configuration'};

// TODO(danielrozenberg): change to @ampproject/release-on-duty after testing is done.
const releaseOnDuty = '@danielrozenberg';

type Awaitable<T> = T | Promise<T>; // https://github.com/microsoft/TypeScript/issues/31394
type CreatePullRequestResponsePromise = ReturnType<
  typeof octokit.createPullRequest
>;

interface VersionMutatorDef {
  versionsChanges: Partial<Versions>;
  title: string;
  body: string;
  branch: string;
}

interface EnablePullRequestAutoMergeResponse {
  enablePullRequestAutoMerge: {
    pullRequest: {
      autoMergeRequest: {
        enabledAt: string;
      };
    };
  };
}

const {auto_merge: autoMerge} = yargs(process.argv.slice(2))
  .options({auto_merge: {type: 'boolean', demandOption: true}})
  .parseSync();

/**
 * Helper used by promote related CI job scripts.
 */
export async function runPromoteJob(
  jobName: string,
  workflow: () => Promise<void>
): Promise<void> {
  console.log('Running', `${jobName}...`);
  try {
    await workflow();
    console.log('Done running', `${jobName}.`);
  } catch (err) {
    console.error('Job', jobName, 'failed.');
    console.error('ERROR:', err);
    process.exitCode = 1;
  }
}

/**
 * Creates a pull request to update versions.json.
 */
export async function createVersionsUpdatePullRequest(
  versionsMutator: (currentVersions: Versions) => Awaitable<VersionMutatorDef>
): CreatePullRequestResponsePromise {
  if (!process.env.ACCESS_TOKEN) {
    throw new Error('Environment variable ACCESS_TOKEN is missing');
  }

  const {body, title, versionsChanges, branch} = await versionsMutator(
    currentVersions
  );

  const newVersions = {
    ...currentVersions,
    ...versionsChanges,
  };

  const pullRequestResponse = await octokit.createPullRequest({
    ...params,
    title,
    body: `${body}\n\n${releaseOnDuty}`,
    head: `promote-job-${branch}`,
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
  console.log('Created pull request', pullRequestResponse.data.number);

  if (autoMerge) {
    const enableAutoMergeResponse =
      await octokit.graphql<EnablePullRequestAutoMergeResponse>(
        `
      mutation(
        $pullRequestId: ID!,
        $mergeMethod: PullRequestMergeMethod!
      ) {
        enablePullRequestAutoMerge(input: {
          pullRequestId: $pullRequestId,
          mergeMethod: $mergeMethod
        }) {
          pullRequest {
            autoMergeRequest {
              enabledAt
            }
          }
        }
      }`,
        {
          pullRequestId: pullRequestResponse.data.node_id,
          mergeMethod: 'SQUASH',
        }
      );
    if (
      enableAutoMergeResponse.enablePullRequestAutoMerge.pullRequest
        .autoMergeRequest.enabledAt
    ) {
      console.log(
        'Enabled auto-merge on pull request',
        pullRequestResponse.data.number
      );
    }
  }

  return pullRequestResponse;
}
