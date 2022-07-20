import {createPullRequest} from 'octokit-plugin-create-pull-request';
import {Octokit} from '@octokit/rest';
import {Versions} from '../configs/schemas/versions';
import * as core from '@actions/core';
import currentVersions from '../configs/versions.json';
import yargs from 'yargs/yargs';

export const octokit = new (Octokit.plugin(createPullRequest))({
  auth: process.env.ACCESS_TOKEN,
});

const versionsJsonFile = 'configs/versions.json';
const params = {owner: 'ampproject', repo: 'cdn-configuration'};

const releaseOnDuty = 'ampproject/release-on-duty';
const qaTeam = 'ampproject/amp-qa';

type Awaitable<T> = T | Promise<T>; // https://github.com/microsoft/TypeScript/issues/31394

interface VersionMutatorDef {
  ampVersion: string;
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
  workflow: () => Promise<string | undefined>
): Promise<void> {
  console.log('Running', `${jobName}...`);
  try {
    const ampVersion = await workflow();
    console.log('Done running', `${jobName}.`);
    core.setOutput('amp-version', ampVersion);
  } catch (err) {
    core.error(`Job ${jobName} failed.`);
    core.setFailed(err as Error);
  }
}

/**
 * Creates a pull request to update versions.json.
 */
export async function createVersionsUpdatePullRequest(
  versionsMutator: (currentVersions: Versions) => Awaitable<VersionMutatorDef>
): Promise<string> {
  if (!process.env.ACCESS_TOKEN) {
    throw new Error('Environment variable ACCESS_TOKEN is missing');
  }
  const {
    ampVersion,
    body: bodyStart,
    title,
    versionsChanges,
    branch,
    qa,
  } = await versionsMutator(currentVersions);

  const footers = [];
  if (qa) {
    footers.push(`@${qaTeam} — please approve this PR for QA`);
  }
  if (autoMerge) {
    footers.push(`@${releaseOnDuty} — FYI`);
  } else {
    footers.push(`@${releaseOnDuty} — please approve and merge this PR`);
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

  if (qa) {
    const requestReviewersResponse = await octokit.rest.pulls.requestReviewers({
      ...params,
      pull_number: pullRequestResponse.data.number,
      team_reviewers: [qaTeam.split('/')[1]], // api only accepts team name
    });

    if (requestReviewersResponse.status == 201) {
      console.log(`Requested ${qaTeam} as QA reviewer`);
    }
  }

  return ampVersion;
}

export function isForwardPromote(
  newVersion: string,
  currentRtvs: string[]
): boolean {
  for (const rtv of currentRtvs) {
    if (rtv.slice(-13) >= newVersion) {
      return false;
    }
  }

  return true;
}
