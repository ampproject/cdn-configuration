import versions from '../configs/versions.json';
import minimist, {ParsedArgs} from 'minimist';

interface Args extends ParsedArgs {
  amp_version?: string;
}
const {amp_version: ampVersion}: Args = minimist(process.argv.slice(2));

function getChannels(): string[] {
  if (!ampVersion) {
    return Object.keys(versions);
  }

  const channels = [];
  for (const [channel, version] of Object.entries(versions)) {
    if (version && version.slice(-13) == ampVersion) {
      channels.push(channel);
    }
  }
  return channels;
}

console.log(getChannels());
