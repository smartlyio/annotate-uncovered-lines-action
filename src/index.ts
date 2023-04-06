import * as core from '@actions/core';
import * as github from '@actions/github';
import * as coverage from './covered';

const inputFileArgument = 'coverage-file';
const coverageTypeArgument = 'coverage-type';
const baseRefArgument = 'base-ref';

async function publishCheck(opts: { totals: { covered: number; total: number }; token: string }) {
  const sha = github.context.payload.pull_request?.head?.sha || github.context.sha;
  const octokit = github.getOctokit(opts.token);

  const description = opts.totals.total
    ? `${((opts.totals.covered / opts.totals.total) * 100).toFixed(
        2
      )}% of changed statements covered by tests`
    : `No changes`;
  const output = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    context: 'Change coverage',
    sha,
    state: 'success' as const,
    description
  };
  await octokit.rest.repos.createCommitStatus(output);
}

function parseCoverageType(coverageType: string): 'lcov' | 'istanbul' {
  if (!coverageType) {
    return 'istanbul';
  } else if (coverageType == 'lcov' || coverageType == 'istanbul') {
    return coverageType;
  }
  throw new Error("coverage-type must be either 'istanbul' or 'lcov'");
}

async function run() {
  const file = core.getInput(inputFileArgument);
  const coverageType = parseCoverageType(core.getInput(coverageTypeArgument, { required: false }));

  const results = await coverage.run({
    base: core.getInput(baseRefArgument),
    head: github.context.sha,
    coverage: file,
    coverageType: coverageType
  });
  let covered = 0;
  let total = 0;
  for (const result of results) {
    covered += result.covered;
    total += result.total;
    for (const [file, lines] of Object.entries(result.uncoveredLines)) {
      for (const line of lines.subranges()) {
        const data = {
          file,
          startLine: line.low,
          endLine: line.high
        };
        // eslint-disable-next-line no-console
        console.log(data);
        core.warning('This change is not covered by tests', data);
      }
    }
  }
  await publishCheck({
    token: core.getInput('github-token'),
    totals: { covered, total }
  });
}
void run();
