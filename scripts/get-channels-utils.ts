import {Versions} from '../configs/schemas/versions';

export function getChannels(
  ampVersion: string,
  currentVersions: Versions
): string[] {
  const channels = [];
  for (const [channel, version] of Object.entries(currentVersions)) {
    if (version && version.slice(-13) == ampVersion) {
      channels.push(channel);
    }
  }
  return channels;
}
