import * as Range from 'drange';
declare type Opts = {
    base: string;
    coverage: string;
    head: string;
    coverageType: 'istanbul' | 'lcov';
};
export declare type Lines = Range;
export declare type Path = string;
export declare function uncovered(args: {
    coverage: Record<Path, Hits>;
    changes: Record<Path, Lines>;
}): Result;
declare type Hits = Array<{
    hits: number;
    start: number;
    end: number;
}>;
export declare type Result = {
    covered: number;
    total: number;
    uncoveredLines: Record<Path, Range>;
};
export declare function run(opts: Opts): Promise<Result[]>;
export {};
