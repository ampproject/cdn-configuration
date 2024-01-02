import * as core from '@actions/core';
import yargs from 'yargs/yargs';

interface Args {
  day_of_month_range: string;
}
const {day_of_month_range: dayOfMonthRange}: Args = yargs(process.argv.slice(2))
  .options({
    day_of_month_range: {type: 'string', demandOption: true},
  })
  .parseSync();

function main() {
  const [minDayStr, maxDayStr] = dayOfMonthRange.split('-', 2);
  const [minDay, maxDay] = [Number(minDayStr), Number(maxDayStr)];
  const today = new Date();

  const inRange = today.getDay() >= minDay && today.getDay() <= maxDay;
  if (inRange) {
    core.info(
      `Today (${today.toDateString()}) is inside the date range for promotion, and will proceed.`
    );
  } else {
    core.warning(
      `Today (${today.toDateString()}) is outside the date range for promotion, and will not proceed.`
    );
  }

  core.setOutput('in-range', inRange);
}

main();
