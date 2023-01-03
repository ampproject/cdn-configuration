import {fetch} from 'undici';
import {Octokit} from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface IndexableVersions {
  [channel: string]: string;
}

interface VersionDiff {
  channel: string;
  version: string;
}

interface PullRequestDetails {
  head: string;
  base: string;
  title: string;
  time: string;
}

async function getVersions(sha: string): Promise<IndexableVersions> {
  const response = await fetch(
    `https://raw.githubusercontent.com/ampproject/cdn-configuration/${sha}/configs/versions.json`
  );
  return (await response.json()) as IndexableVersions;
}

export async function getVersionDiff(
  head: string,
  base: string
): Promise<VersionDiff[]> {
  const headVersions = await getVersions(head);
  const baseVersions = await getVersions(base);

  const results: VersionDiff[] = [];
  for (const [channel, rtv] of Object.entries(headVersions)) {
    if (rtv !== baseVersions[channel]) {
      results.push({channel, version: rtv.slice(-13)});
    }
  }

  return results;
}

export async function getSha(ampVersion: string): Promise<string | void> {
  try {
    const {data: ref} = await octokit.rest.git.getRef({
      owner: 'ampproject',
      repo: 'amphtml',
      ref: `tags/${ampVersion}`,
    });

    if (ref) {
      return ref.object.sha;
    }
  } catch {
    const {data: branch} = await octokit.rest.repos.getBranch({
      owner: 'ampproject',
      repo: 'amphtml',
      branch: `amp-release-${ampVersion}`,
    });

    if (branch) {
      return branch.commit.sha;
    }
  }
}

export async function getBaseAmpVersion(
  headAmpVersion: string,
  baseChannel: string
): Promise<string | void> {
  const {data: commits} = await octokit.rest.repos.listCommits({
    owner: 'ampproject',
    repo: 'cdn-configuration',
    path: 'configs/versions.json',
    per_page: 100,
  });

  for await (const commit of commits) {
    const versions = await getVersions(commit.sha);
    const baseAmpVersion = versions[baseChannel].slice(-13);
    if (baseAmpVersion != headAmpVersion) {
      return baseAmpVersion;
    }
  }
}

export async function getPullRequestDetails(
  pullNumber: number
): Promise<PullRequestDetails | void> {
  const {data: pr} = await octokit.rest.pulls.get({
    owner: 'ampproject',
    repo: 'cdn-configuration',
    pull_number: pullNumber,
  });

  if (!pr.merge_commit_sha || !pr.merged_at) return;

  const {data: commit} = await octokit.rest.repos.getCommit({
    owner: 'ampproject',
    repo: 'cdn-configuration',
    ref: pr.merge_commit_sha,
  });

  return {
    head: pr.merge_commit_sha,
    base: commit.parents[0].sha,
    title: pr.title,
    time: pr.merged_at,
  };
}
