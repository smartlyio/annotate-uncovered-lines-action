"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const github = require("@actions/github");
const assert = require("assert");
const coverage = require("./covered");
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
            console.log(`::warning file=${file},line=${line.low},endLine=${line.high}::This change is not covered by tests`);
        }
    }
}
void run();
//# sourceMappingURL=index.js.map