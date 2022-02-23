import {Versions} from '../configs/schemas/versions';

export function getChannels(
  ampVersion: string,
  currentVersions: Versions
): string[] {
  return Object.entries(currentVersions)
    .filter(([, version]) => version?.slice(-13) == ampVersion)
    .map(([channel]) => channel);
}
