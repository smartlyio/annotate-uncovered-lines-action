"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const coverage = require("./src/covered");
async function test(opts) {
    process.chdir(opts.cwd);
    const results = await coverage.run({
        base: 'origin/master',
        head: 'head',
        coverage: opts.coverageFile,
        coverageType: opts.coverageType
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
const opts = {
    coverageFile: process.argv[3],
    cwd: process.argv[2],
    coverageType: (_a = process.argv[4]) !== null && _a !== void 0 ? _a : 'istanbul'
};
// eslint-disable-next-line no-console
console.log(opts);
void test(opts);
//# sourceMappingURL=test.js.map