import yargs from 'yargs/yargs';
import {getVersionDiff} from './post-promote-tasks-utils';

const {head, base} = yargs(process.argv.slice(2))
  .options({
    head: {type: 'string', demandOption: true},
    base: {type: 'string', demandOption: true},
  })
  .parseSync();

//TODO(estherkim): add calendar, release tagger tasks
interface PostPromoteTask {
  'npm-tag'?: string;
}

interface VersionTask extends PostPromoteTask {
  'amp-version': string;
}

const POST_PROMOTE_TASKS: {[channel: string]: PostPromoteTask} = {
  nightly: {
    'npm-tag': 'nightly',
  },
  stable: {
    'npm-tag': 'latest',
  },
};

async function setOutput() {
  const tasks: VersionTask[] = [];
  const versionDiff = await getVersionDiff(head, base);

  versionDiff.forEach((diff) => {
    const task = POST_PROMOTE_TASKS[diff.channel];
    if (task) {
      tasks.push({'amp-version': diff['amp-version'], ...task});
    }
  });

  process.stdout.write(JSON.stringify(tasks));
}

void setOutput();
