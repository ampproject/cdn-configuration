import minimist from 'minimist';

const {diff} = minimist(process.argv.slice(2));
const files = diff.split(' ');
for (const file in files) {
  if (file.endsWith('.json')) {
    console.log(file);
    // validate 
  }
}
