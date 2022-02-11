import {Octokit} from '@octokit/rest';
const params = {owner: 'ampproject', repo: 'amphtml'};

export async function getMissingCommits(
  octokit: Octokit,
  ampVersion: string,
  releases: Set<string>
) {
  const missingShas: string[] = [];

  // get distinct shas that were cherry-picked
  const mainShas = new Set<string>();
  for (const release of releases) {
    const commits = await getCherryPickCommits(octokit, release);
    if (!commits) continue;

    for (const commit of commits) {
      const sha = getMainBranchShaFromCommitMessage(commit.commit.message);
      if (!sha) continue;

      mainShas.add(sha);
    }
  }

  // get cherry-picked shas that aren't in commit tree
  for (const mainSha of mainShas) {
    if (!(await isMissing(octokit, ampVersion, mainSha))) continue;

    missingShas.push(mainSha);
  }

  return missingShas;
}

async function getCherryPickCommits(octokit: Octokit, release: string) {
  if (release.endsWith('000')) return;
  const base = release.slice(0, 10) + '000';
  const response = await octokit.rest.repos.compareCommitsWithBasehead({
    ...params,
    basehead: `${base}...${release}`,
  });
  return response.data.commits;
}

function getMainBranchShaFromCommitMessage(message: string) {
  const match = message.match(/cherry picked from commit ([0-9a-f]{40})/);
  return match ? match[1] : null;
}

async function isMissing(octokit: Octokit, ampVersion: string, sha: string) {
  const response = await octokit.rest.repos.compareCommitsWithBasehead({
    ...params,
    basehead: `${ampVersion}...${sha}`,
  });
  if (response.status !== 200) return false;
  return ['diverged', 'ahead'].includes(response.data.status);
}
