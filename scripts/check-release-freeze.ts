import * as core from '@actions/core';
import freezedatesJson from '../configs/freezedates.json';

function main() {
  let freeze = false;
  const today = new Date();

  for (const freezedate of freezedatesJson.freezedates) {
    const start = new Date(freezedate.start);
    const end = new Date(freezedate.end);

    if (start <= today && today <= end) {
      core.info(`There is a release freeze in effect today.`);
      core.info(
        `Date range: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
      );
      core.info(`Description: ${freezedate.description}`);
      freeze = true;
      break;
    }
  }

  core.setOutput('freeze', freeze);
}

main();
