import type {ChannelNames, Versions} from '../configs/schemas/versions';

export function getChannels(
  ampVersion: string,
  currentVersions: Versions
): ChannelNames[] {
  return Object.entries(currentVersions)
    .filter(([, version]) => version?.slice(-13) == ampVersion)
    .map(([channel]) => channel as ChannelNames);
}
