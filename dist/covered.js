"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uncoveredLines = void 0;
const fs_1 = require("fs");
const child = require("child_process");
const util_1 = require("util");
const pathFs = require("path");
const Range = require("drange");
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
            head.add(start, start + count - 1);
        }
    }
    return result;
}
function uncovered(args) {
    var _a;
    const result = {};
    const coveredChanges = 0;
    const uncoveredChanges = 0;
    for (const path of Object.keys(args.changes)) {
        const changes = (_a = args.changes[path]) !== null && _a !== void 0 ? _a : [];
        const cov = args.coverage[path];
        if (!cov) {
            continue;
        }
        const uncovered = changes.subtract(cov);
        if (uncovered.length) {
            result[path] = uncovered;
        }
    }
    return {
        covered: coveredChanges,
        uncovered: uncoveredChanges,
        uncoveredLines: result
    };
}
async function coveredLines(opts) {
    const coverage = JSON.parse(await (0, util_1.promisify)(fs_1.readFile)(opts.coverage, 'utf8'));
    const result = {};
    for (const absolutePath of Object.keys(coverage)) {
        const path = pathFs.relative(process.cwd(), absolutePath);
        const collect = (result[path] = new Range());
        for (const statementIndex of Object.values(coverage[absolutePath].s)) {
            const hit = coverage[absolutePath].statementMap[statementIndex];
            if (!hit) {
                continue;
            }
            collect.add(hit.start.line, hit.end.line);
        }
    }
    return result;
}
async function uncoveredLines(opts) {
    const coverage = await coveredLines(opts);
    const changes = await changedLines(opts);
    return uncovered({ coverage, changes });
}
exports.uncoveredLines = uncoveredLines;
//# sourceMappingURL=covered.js.map