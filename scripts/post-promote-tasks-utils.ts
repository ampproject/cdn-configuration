import fetch from 'node-fetch';
import {Octokit} from '@octokit/rest';

interface IndexableVersions {
  [channel: string]: string;
}

interface VersionDiff {
  channel: string;
  version: string;
}

async function getVersions(sha: string): Promise<IndexableVersions> {
  const url = (sha: string) =>
    `https://raw.githubusercontent.com/ampproject/cdn-configuration/${sha}/configs/versions.json`;
  const response = await fetch(url(sha));
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

export async function getBaseAmpVersion(
  headAmpVersion: string,
  baseChannel: string
): Promise<string | void> {
  const octokit = new Octokit();
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
