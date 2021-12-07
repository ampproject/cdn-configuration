import minimist from 'minimist';
import versions from '../configs/versions.json'
import clientExperiments from '../configs/client-side-experiments.json';

const {diff} = minimist(process.argv.slice(2));
const files = diff.split(' ');

for (const file of files) {
  if (file.endsWith('versions.json')) {
    console.log('Checking', file);
    console.log(versions);
  }

  if (file.endsWith('client-side-experiments.json')) {
    console.log('Checking', file);
    console.log(clientExperiments);
  }
}
