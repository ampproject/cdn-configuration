import yargs from 'yargs/yargs';
import {Octokit} from '@octokit/rest';

const {
  org,
  team: team_slug,
  user,
} = yargs(process.argv.slice(2))
  .options({
    org: {type: 'string', demandOption: true},
    team: {type: 'string', demandOption: true},
    user: {type: 'string', demandOption: true},
  })
  .parseSync();

const octokit = new Octokit({
  auth: process.env.READ_ORG,
});

async function checkTeamMembership() {
  const {data: members} = await octokit.rest.teams.listMembersInOrg({
    org,
    team_slug,
  });

  const isMember = members.some((member) => member.login == user);
  process.stdout.write(`${isMember}`);
}

void checkTeamMembership();
