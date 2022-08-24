import * as coverage from '../src/covered';
import * as Range from 'drange';

describe('coverage', () => {
  it('generate coverage', async () => {
    const cwd = process.cwd();
    try {
      process.chdir('./test-fixture');
      const results = await coverage.run({
        base: 'master',
        head: 'test-branch',
        coverage: process.cwd() + '/coverage/coverage-final.json'
      });
      expect(results).toEqual([
        {
          covered: 15,
          total: 17,
          uncoveredLines: {
            'example.ts': new Range().add(6, 6).add(16, 16)
          }
        }
      ]);
    } finally {
      process.chdir(cwd);
    }
  });
});
