import * as Range from 'drange';
declare type Opts = {
    base: string;
    coverage: string;
    head: string;
};
export declare type Lines = Range;
export declare type Path = string;
export declare type Result = {
    covered: number;
    uncovered: number;
    uncoveredLines: Record<Path, Range>;
};
export declare function uncoveredLines(opts: Opts): Promise<Result>;
export {};
