import yargs from 'yargs/yargs';
import {Octokit} from '@octokit/rest';

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
    if (review.state == 'approved' && review.user) {
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
  process.stdout.write(`${isQa}`);
}

void setOutput();
