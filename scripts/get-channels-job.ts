import yargs from 'yargs/yargs';
import currentVersions from '../configs/versions.json';
import {getChannels} from './get-channels-utils';

const {amp_version: ampVersion} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string', demandOption: true}})
  .parseSync();

function setOutput() {
  const channels = getChannels(ampVersion, currentVersions);
  process.stdout.write(channels.join(', '));
}

setOutput();
