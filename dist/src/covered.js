"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.uncovered = void 0;
const fs_1 = require("fs");
const child = require("child_process");
const util_1 = require("util");
const pathFs = require("path");
const Range = require("drange");
const glob_1 = require("glob");
const assert = require("assert");
const parse_lcov_1 = require("parse-lcov");
async function runGit(command) {
    const [ex, ...args] = command.split(' ');
    return new Promise((ok, fail) => {
        const collected = [];
        const errors = [];
        const run = child.spawn(ex, args);
        run.stderr.setEncoding('utf8');
        run.stderr.on('data', (msg) => {
            errors.push(msg);
        });
        run.stdout.setEncoding('utf8');
        run.stdout.on('data', (msg) => collected.push(msg));
        run.on('close', () => {
            ok(collected.join(''));
        });
        run.on('error', (err) => {
            fail(`got error from rungit "${err.message}" ${err.stack}
      
      stderr:
      ${errors.join('')}`);
        });
    });
}
async function changedLines(opts) {
    const stdout = await runGit(`git diff -w -U0 ${opts.base}...${opts.head}`);
    const result = {};
    let currentFile = null;
    for (const line of stdout.split('\n')) {
        const fileHeader = line.match(/^\+\+\+ b\/(.*)/);
        if (fileHeader && fileHeader[1]) {
            currentFile = fileHeader[1];
            result[currentFile] = new Range();
            continue;
        }
        const changeHeader = line.match(/^@@ .* \+(\d+)(,\d+)?/);
        if (changeHeader) {
            const start = Number(changeHeader[1]);
            const count = changeHeader[2] ? Number(changeHeader[2].slice(1)) : 1;
            if (!currentFile) {
                continue;
            }
            const head = result[currentFile];
            if (!head) {
                continue;
            }
            const high = start + count - 1;
            head.add(Math.min(start, high), Math.max(start, high));
        }
    }
    return result;
}
function uncovered(args) {
    var _a, _b;
    const result = {};
    let coveredChanges = 0;
    let totalChanges = 0;
    for (const path of Object.keys(args.changes)) {
        const uncovered = new Range();
        const changes = (_a = args.changes[path]) !== null && _a !== void 0 ? _a : new Range();
        const hits = (_b = args.coverage[path]) === null || _b === void 0 ? void 0 : _b.sort((a, b) => a.start - b.start);
        if (!hits) {
            continue;
        }
        let lowerBoundIndex = 0;
        for (const subrange of changes.subranges().sort((a, b) => a.low - b.low)) {
            for (let i = lowerBoundIndex; i < hits.length && hits[i].start < subrange.high; i++) {
                const hit = hits[i];
                if (subrange.low > hit.end) {
                    // all following subranges will have 'low > current range 'low so
                    // no need to consider prior hits for those
                    lowerBoundIndex++;
                    // lets consider next hit
                    continue;
                }
                if (subrange.high < hit.start) {
                    // subrange ends before next hit starts
                    // all following hits will have 'start > current hit 'start
                    // so we are done with the current subrange
                    break;
                }
                if (hit.hits === 0) {
                    uncovered.add(new Range(subrange.low, subrange.high).intersect(hit.start, hit.end));
                }
            }
        }
        totalChanges += changes.length;
        coveredChanges += changes.length - uncovered.length;
        if (uncovered.length) {
            result[path] = uncovered;
        }
    }
    return {
        covered: coveredChanges,
        total: totalChanges,
        uncoveredLines: result
    };
}
exports.uncovered = uncovered;
async function coveredLines(opts) {
    return opts.coverageType === 'lcov' ? lcovCoveredLines(opts) : istanbulCoveredLines(opts);
}
async function istanbulCoveredLines(opts) {
    const coverage = JSON.parse(await (0, util_1.promisify)(fs_1.readFile)(opts.coverage, 'utf8'));
    const result = {};
    for (const absolutePath of Object.keys(coverage)) {
        const path = pathFs.relative(process.cwd(), absolutePath);
        const collect = [];
        result[path] = collect;
        for (const statementIndex of Object.keys(coverage[absolutePath].s)) {
            const hit = coverage[absolutePath].statementMap[statementIndex];
            if (!hit) {
                continue;
            }
            collect.push({
                hits: coverage[absolutePath].s[statementIndex],
                start: Math.min(hit.start.line, hit.end.line),
                end: Math.max(hit.start.line, hit.end.line)
            });
        }
    }
    return result;
}
async function lcovCoveredLines(opts) {
    const fileContents = await (0, util_1.promisify)(fs_1.readFile)(opts.coverage, 'utf8');
    const lcovData = (0, parse_lcov_1.default)(fileContents);
    return lcovData.reduce((result, fileEntry) => {
        const path = pathFs.isAbsolute(fileEntry.file)
            ? pathFs.normalize(pathFs.relative(process.cwd(), fileEntry.file))
            : pathFs.normalize(fileEntry.file);
        result[path] = fileEntry.lines.details.map(({ line, hit }) => ({
            hits: hit,
            start: line,
            end: line
        }));
        return result;
    }, {});
}
async function uncoveredLines(opts) {
    const coverage = await coveredLines(opts);
    const changes = await changedLines(opts);
    return uncovered({ coverage, changes });
}
async function run(opts) {
    const results = [];
    for (const file of glob_1.glob.sync(opts.coverage)) {
        if (opts.coverageType === 'istanbul') {
            assert(/\.json$/.test(file), `input file '${file}' must be json coverage file`);
        }
        results.push(await uncoveredLines({
            base: opts.base,
            head: opts.head,
            coverage: file,
            coverageType: opts.coverageType
        }));
    }
    return results;
}
exports.run = run;
//# sourceMappingURL=covered.js.map