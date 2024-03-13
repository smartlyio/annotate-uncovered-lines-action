import * as core from '@actions/core';
import * as github from '@actions/github';
import { run as runCoverage, CoverageFormat } from './covered';

function assertCoverageFormat(coverageType: string): asserts coverageType is CoverageFormat {
  if (!['lcov', 'istanbul', 'cobertura'].includes(coverageType)) {
    throw new Error(`Invalid coverage type: ${coverageType}`);
  }
}

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

async function run() {
  const file = core.getInput('coverage-file', { required: true });
  const coverageFormat = core.getInput('coverage-format', { required: false });

  assertCoverageFormat(coverageFormat);

  const result = await runCoverage({
    base: core.getInput('base-ref'),
    head: github.context.sha,
    coverage: file,
    coverageFormat
  });
  let covered = 0;
  let total = 0;
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
  await publishCheck({
    token: core.getInput('github-token', { required: true }),
    totals: { covered, total }
  });
}
void run();
