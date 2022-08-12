import { readFile } from 'fs';
import * as child from 'child_process';
import { promisify } from 'util';
import * as pathFs from 'path';
import * as Range from 'drange';
import { glob } from 'glob';
import * as assert from 'assert';

type Opts = {
  base: string;
  coverage: string;
  head: string;
};

export type Lines = Range;
export type Path = string;

async function runGit(command: string): Promise<string> {
  const [ex, ...args] = command.split(' ');
  return new Promise((ok, fail) => {
    const collected: string[] = [];
    const errors: string[] = [];
    const run = child.spawn(ex, args);
    run.stderr.setEncoding('utf8');
    run.stderr.on('data', (msg: string) => {
      errors.push(msg);
    });
    run.stdout.setEncoding('utf8');
    run.stdout.on('data', (msg: string) => collected.push(msg));
    run.on('close', () => {
      ok(collected.join(''));
    });
    run.on('error', (err: Error) => {
      fail(`got error from rungit "${err.message}" ${err.stack}
      
      stderr:
      ${errors.join('')}`);
    });
  });
}
async function changedLines(opts: Opts): Promise<Record<Path, Lines>> {
  const stdout = await runGit(`git diff -w -U0 ${opts.base}...${opts.head}`);
  const result: Record<Path, Lines> = {};
  let currentFile: Path | null = null;
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

function uncovered(args: { coverage: Record<Path, Lines>; changes: Record<Path, Lines> }): Result {
  const result: Record<Path, Lines> = {};
  const coveredChanges = 0;
  const uncoveredChanges = 0;
  for (const path of Object.keys(args.changes)) {
    const changes = args.changes[path] ?? [];
    const cov = args.coverage[path];
    if (!cov) {
      continue;
    }
    const uncovered: Lines = changes.subtract(cov);
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

async function coveredLines(opts: Opts): Promise<Record<Path, Lines>> {
  const coverage = JSON.parse(await promisify(readFile)(opts.coverage, 'utf8'));
  const result: Record<Path, Lines> = {};
  for (const absolutePath of Object.keys(coverage)) {
    const path = pathFs.relative(process.cwd(), absolutePath);
    const collect: Lines = (result[path] = new Range());
    for (const statementIndex of Object.values<any>(coverage[absolutePath].s)) {
      const hit = coverage[absolutePath].statementMap[statementIndex];
      if (!hit) {
        continue;
      }
      collect.add(hit.start.line, hit.end.line);
    }
  }
  return result;
}

export type Result = { covered: number; uncovered: number; uncoveredLines: Record<Path, Range> };
async function uncoveredLines(opts: Opts): Promise<Result> {
  const coverage = await coveredLines(opts);
  const changes = await changedLines(opts);
  return uncovered({ coverage, changes });
}

export async function run(opts: Opts) {
  const results = [];
  for (const file of glob.sync(opts.coverage)) {
    assert(/\.json$/.test(file), `input file '${file}' must be json coverage file`);
    results.push(
      await uncoveredLines({
        base: opts.base,
        head: opts.head,
        coverage: file
      })
    );
  }
  return results;
}
