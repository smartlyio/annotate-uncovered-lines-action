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
      const high = start + count - 1;
      head.add(Math.min(start, high), Math.max(start, high));
    }
  }
  return result;
}

export function uncovered(args: {
  coverage: Record<Path, Hits>;
  changes: Record<Path, Lines>;
}): Result {
  const result: Record<Path, Lines> = {};
  let coveredChanges = 0;
  let totalChanges = 0;
  for (const path of Object.keys(args.changes)) {
    const uncovered = new Range();
    const changes = args.changes[path] ?? new Range();
    const hits = args.coverage[path]?.sort((a, b) => a.start - b.start);
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

type Hits = Array<{
  hits: number;
  start: number;
  end: number;
}>;
async function coveredLines(opts: Opts): Promise<Record<Path, Hits>> {
  const coverage = JSON.parse(await promisify(readFile)(opts.coverage, 'utf8'));
  const result: Record<Path, Hits> = {};
  for (const absolutePath of Object.keys(coverage)) {
    const path = pathFs.relative(process.cwd(), absolutePath);
    const collect: Hits = [];
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

export type Result = { covered: number; total: number; uncoveredLines: Record<Path, Range> };
async function uncoveredLines(opts: Opts): Promise<Result> {
  const coverage = await coveredLines(opts);
  const changes = await changedLines(opts);
  return uncovered({ coverage, changes });
}

export async function run(opts: Opts): Promise<Result[]> {
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
