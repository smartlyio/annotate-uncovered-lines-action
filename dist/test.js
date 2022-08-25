"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coverage = require("./src/covered");
async function test(opts) {
    process.chdir(opts.cwd);
    const results = await coverage.run({
        base: 'origin/master',
        head: 'head',
        coverage: opts.coverageFile
    });
    for (const result of results) {
        // eslint-disable-next-line no-console
        console.log(`covered changes ${result.covered}/ total changes ${result.total}`);
        for (const [path, range] of Object.entries(result.uncoveredLines)) {
            for (const extent of range.subranges()) {
                // eslint-disable-next-line no-console
                console.log(`${path} start:${extent.low} end:${extent.high}`);
            }
        }
    }
}
const opts = { coverageFile: process.argv[3], cwd: process.argv[2] };
// eslint-disable-next-line no-console
console.log(opts);
void test(opts);
//# sourceMappingURL=test.js.map