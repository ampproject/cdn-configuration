import minimist from 'minimist';

const {diff} = minimist(process.argv.slice(2));
const files = diff.split(' ');

for (const file of files) {
  if (file.endsWith('versions.json')) {
    console.log('Checking', file);
  }

  if (file.endsWith('client-side-experiments.json')) {
    console.log('Checking', file);
  }
}
