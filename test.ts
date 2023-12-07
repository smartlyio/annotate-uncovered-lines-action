import * as coverage from './src/covered';

async function test(opts: { coverageFile: string; cwd: string; coverageType: string }) {
  process.chdir(opts.cwd);
  const result = await coverage.run({
    base: 'origin/master',
    head: 'head',
    coverage: opts.coverageFile,
    coverageType: opts.coverageType as any
  });
  // eslint-disable-next-line no-console
  console.log(`covered changes ${result.covered}/ total changes ${result.total}`);

  for (const [path, range] of Object.entries(result.uncoveredLines)) {
    for (const extent of range.subranges()) {
      // eslint-disable-next-line no-console
      console.log(`${path} start:${extent.low} end:${extent.high}`);
    }
  }
}
const opts = {
  coverageFile: process.argv[3],
  cwd: process.argv[2],
  coverageType: process.argv[4] ?? 'istanbul'
};
// eslint-disable-next-line no-console
console.log(opts);
void test(opts);
