import * as core from '@actions/core';
import * as github from '@actions/github';
import * as assert from 'assert';
import * as coverage from './covered';

const inputFileArgument = 'coverage-file';
const baseRefArgument = 'base-ref';

async function run() {
  const file = core.getInput(inputFileArgument);
  assert(/\.json$/.test(file), `input file '${file}' must be json coverage file`);
  const result = await coverage.uncoveredLines({
    base: core.getInput(baseRefArgument),
    head: github.context.sha,
    coverage: file
  });
  for (const [file, lines] of Object.entries(result.uncoveredLines)) {
    for (const line of lines.subranges()) {
      // eslint-disable-next-line no-console
      console.log(
        `::warning file=${file},line=${line.low},endLine=${line.high}::This change is not covered by tests`
      );
    }
  }
}
void run();
