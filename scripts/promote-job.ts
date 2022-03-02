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

const releaseOnDuty = '@ampproject/release-on-duty';
const qaTeam = '@ampproject/amp-qa';

type Awaitable<T> = T | Promise<T>; // https://github.com/microsoft/TypeScript/issues/31394
type CreatePullRequestResponsePromise = ReturnType<
  typeof octokit.createPullRequest
>;

interface VersionMutatorDef {
  versionsChanges: Partial<Versions>;
  title: string;
  body: string;
  branch: string;
  qa?: boolean;
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

  const {
    body: bodyStart,
    title,
    versionsChanges,
    branch,
    qa,
  } = await versionsMutator(currentVersions);

  const footers = [];
  if (qa) {
    footers.push(`${qaTeam} — please approve this PR for QA`);
  }
  if (autoMerge) {
    footers.push(`${releaseOnDuty} — FYI`);
  } else {
    footers.push(`${releaseOnDuty} — please approve and merge this PR`);
  }
  const body = `${bodyStart}\n\n${footers.join('\n')}`;

  const newVersions = {
    ...currentVersions,
    ...versionsChanges,
  };

  // Ensure that there is an empty line between each channel, so that multiple
  // auto-generated PRs that modify different channels will not result in a
  // merge conflict.
  const newVersionsJsonString =
    JSON.stringify(newVersions, undefined, 2).replace(/,\n/g, ',\n\n') + '\n';

  const pullRequestResponse = await octokit.createPullRequest({
    ...params,
    title,
    body,
    head: `promote-job-${branch}`,
    changes: [
      {
        files: {
          [versionsJsonFile]: newVersionsJsonString,
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
