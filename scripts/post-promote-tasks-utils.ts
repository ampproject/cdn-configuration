import fetch from 'node-fetch';

interface IndexableVersions {
  [channel: string]: string;
}

interface VersionDiff {
  channel: string;
  version: string;
}

export async function getVersionDiff(
  head: string,
  base: string
): Promise<VersionDiff[]> {
  const url = (sha: string) =>
    `https://raw.githubusercontent.com/ampproject/cdn-configuration/${sha}/configs/versions.json`;

  const headResponse = await fetch(url(head));
  const headVersions = (await headResponse.json()) as IndexableVersions;

  const baseResponse = await fetch(url(base));
  const baseVersions = (await baseResponse.json()) as IndexableVersions;

  const results: VersionDiff[] = [];
  for (const [channel, rtv] of Object.entries(headVersions)) {
    if (rtv !== baseVersions[channel]) {
      results.push({channel, version: rtv.slice(-13)});
    }
  }

  return results;
}
