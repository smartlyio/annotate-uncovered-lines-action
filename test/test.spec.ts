import * as coverage from '../src/covered';
import * as Range from 'drange';

describe('coverage', () => {
  describe('uncovered', () => {
    it('handles multiple changes', () => {
      const result = coverage.uncovered({
        coverage: {
          'test.ts': [{ hits: 0, start: 1, end: 4 }]
        },
        changes: { 'test.ts': new Range().add(1, 2).add(1, 4) }
      });
      expect(result).toEqual({
        covered: 0,
        total: 4,
        uncoveredLines: {
          'test.ts': new Range(1, 4)
        }
      });
    });
    it('handles multiple hits', () => {
      const result = coverage.uncovered({
        coverage: {
          'test.ts': [
            { hits: 0, start: 1, end: 4 },
            { hits: 0, start: 3, end: 9 }
          ]
        },
        changes: { 'test.ts': new Range().add(1, 2) }
      });
      expect(result).toEqual({
        covered: 0,
        total: 2,
        uncoveredLines: {
          'test.ts': new Range(1, 2)
        }
      });
    });
    it('reports covered', () => {
      const result = coverage.uncovered({
        coverage: { 'test.ts': [{ hits: 1, start: 1, end: 10 }] },
        changes: { 'test.ts': new Range().add(1, 2) }
      });
      expect(result).toEqual({
        covered: 2,
        total: 2,
        uncoveredLines: {}
      });
    });
    it('reports uncovered', () => {
      const result = coverage.uncovered({
        coverage: { 'test.ts': [{ hits: 0, start: 1, end: 10 }] },
        changes: { 'test.ts': new Range().add(1, 2) }
      });
      expect(result).toEqual({
        covered: 0,
        total: 2,
        uncoveredLines: {
          'test.ts': new Range().add(1, 2)
        }
      });
    });
    it('works with empty result', () => {
      const result = coverage.uncovered({
        coverage: { 'test.ts': [] },
        changes: { 'test.ts': new Range() }
      });
      expect(result).toEqual({
        covered: 0,
        total: 0,
        uncoveredLines: {}
      });
    });
  });

  it('generate coverage', async () => {
    const cwd = process.cwd();
    try {
      process.chdir('./test-fixture');
      const result = await coverage.run({
        base: 'master',
        head: 'test-branch',
        coverage: process.cwd() + '/coverage/coverage-final.json',
        coverageFormat: 'istanbul'
      });
      expect(result).toEqual({
        covered: 15,
        total: 17,
        uncoveredLines: {
          'example.ts': new Range().add(6, 6).add(16, 16)
        }
      });
    } finally {
      process.chdir(cwd);
    }
  });

  it('generate coverage for lcov', async () => {
    const cwd = process.cwd();
    try {
      process.chdir('./test-fixture');
      const result = await coverage.run({
        base: 'master',
        head: 'test-branch',
        coverage: process.cwd() + '/coverage/lcov.info',
        coverageFormat: 'lcov'
      });
      expect(result).toEqual({
        covered: 15,
        total: 17,
        uncoveredLines: {
          'example.ts': new Range().add(6, 6).add(16, 16)
        }
      });
    } finally {
      process.chdir(cwd);
    }
  });

  it('generate coverage for Cobertura', async () => {
    const cwd = process.cwd();
    try {
      process.chdir('./test-fixture');
      const result = await coverage.run({
        base: 'master',
        head: 'test-branch',
        coverage: process.cwd() + '/coverage/cobertura-coverage.xml',
        coverageFormat: 'cobertura'
      });
      expect(result).toEqual({
        covered: 15,
        total: 17,
        uncoveredLines: {
          'example.ts': new Range().add(6, 6).add(16, 16)
        }
      });
    } finally {
      process.chdir(cwd);
    }
  });
});
