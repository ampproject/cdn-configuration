import minimist from 'minimist';

const {files} = minimist(process.argv.slice(2));

console.log(files);
console.log(files.length);

// for (const file in files) {
//   if (file.endsWith('.json')) {
//     // validate 
//   }
// }
