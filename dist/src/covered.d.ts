import * as Range from 'drange';
export type CoverageFormat = 'lcov' | 'istanbul';
type Opts = {
    base: string;
    coverage: string;
    head: string;
    coverageFormat: CoverageFormat;
};
export type Lines = Range;
export type Path = string;
export declare function uncovered(args: {
    coverage: Record<Path, Hits>;
    changes: Record<Path, Lines>;
}): Result;
type Hits = Array<{
    hits: number;
    start: number;
    end: number;
}>;
export type Result = {
    covered: number;
    total: number;
    uncoveredLines: Record<Path, Range>;
};
export declare function run(opts: Opts): Promise<Result>;
export {};
