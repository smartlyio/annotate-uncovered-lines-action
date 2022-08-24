import * as core from '@actions/core';
import * as github from '@actions/github';
import * as coverage from './covered';

const inputFileArgument = 'coverage-file';
const baseRefArgument = 'base-ref';

async function publishCheck(opts: { totals: { covered: number; total: number }; token: string }) {
  const sha = github.context.payload.pull_request?.head?.sha || github.context.sha;
  const octokit = github.getOctokit(opts.token);

  const totalCoverage = (opts.totals.covered / opts.totals.total) * 100;
  const output = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    context: 'Coverage',
    sha,
    state: 'success' as const,
    description: `Changed statement coverage ${totalCoverage.toFixed(2)}%`
  };
  await octokit.rest.repos.createCommitStatus(output);
}

async function run() {
  const file = core.getInput(inputFileArgument);
  const results = await coverage.run({
    base: core.getInput(baseRefArgument),
    head: github.context.sha,
    coverage: file
  });
  let covered = 0;
  let total = 0;
  for (const result of results) {
    covered += result.covered;
    total += result.total;
    for (const [file, lines] of Object.entries(result.uncoveredLines)) {
      for (const line of lines.subranges()) {
        // eslint-disable-next-line no-console
        console.log(
          `::warning file=${file},line=${line.low},endLine=${line.high}::This change is not covered by tests`
        );
      }
    }
  }
  await publishCheck({
    token: core.getInput('github-token'),
    totals: { covered, total }
  });
}
void run();
