"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const github = require("@actions/github");
const coverage = require("./covered");
const inputFileArgument = 'coverage-file';
const coverageTypeArgument = 'coverage-type';
const baseRefArgument = 'base-ref';
async function publishCheck(opts) {
    var _a, _b;
    const sha = ((_b = (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.head) === null || _b === void 0 ? void 0 : _b.sha) || github.context.sha;
    const octokit = github.getOctokit(opts.token);
    const description = opts.totals.total
        ? `Changed statement coverage ${((opts.totals.covered / opts.totals.total) * 100).toFixed(2)}%`
        : `No changes`;
    const output = {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        context: 'Change coverage',
        sha,
        state: 'success',
        description
    };
    await octokit.rest.repos.createCommitStatus(output);
}
function parseCoverageType(coverageType) {
    if (!coverageType) {
        return 'istanbul';
    }
    else if (coverageType == 'lcov' || coverageType == 'istanbul') {
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
//# sourceMappingURL=index.js.map