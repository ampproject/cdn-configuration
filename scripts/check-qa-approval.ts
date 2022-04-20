import yargs from 'yargs/yargs';
import {Octokit} from '@octokit/rest';
import * as core from '@actions/core';

const {pull_number} = yargs(process.argv.slice(2))
  .options({pull_number: {type: 'number', demandOption: true}})
  .parseSync();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getApprovers(): Promise<string[]> {
  const {data: reviews} = await octokit.rest.pulls.listReviews({
    owner: 'ampproject',
    repo: 'cdn-configuration',
    pull_number,
  });

  const approvers: string[] = [];
  reviews.forEach((review) => {
    if (review.state.toUpperCase() == 'APPROVED' && review.user) {
      approvers.push(review.user.login);
    }
  });

  return approvers;
}

async function checkQaTeamMembership(approvers: string[]): Promise<boolean> {
  const {data: members} = await octokit.rest.teams.listMembersInOrg({
    org: 'ampproject',
    team_slug: 'amp-qa',
  });

  return members.some((member) => approvers.includes(member.login));
}

async function setOutput(): Promise<void> {
  const approvers = await getApprovers();
  if (approvers.length < 1) {
    return;
  }

  const isQa = await checkQaTeamMembership(approvers);
  if (!isQa) {
    core.setFailed(
      'Stable and Beta 1% promotions require approval by a member of @ampproject/amp-qa'
    );
  }
}

void setOutput();
