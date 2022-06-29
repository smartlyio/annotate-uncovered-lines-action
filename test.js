const coverage = require('./dist/covered');

async function test() {
  const result = await coverage.uncoveredLines({
    base: 'origin/master',
    head: 'head',
    coverage: '/Users/sakari/work/platform-sdk/coverage/coverage-final.json'
  });
  for (const [path, range] of Object.entries(result.uncoveredLines)) {
    for (const extent of range.subranges()) {
      // eslint-disable-next-line no-console
      console.log(`${path} start:${extent.low} end:${extent.high}`);
    }
  }
}
void test();
