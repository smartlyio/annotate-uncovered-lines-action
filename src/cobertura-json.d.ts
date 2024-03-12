declare module '@cvrg-report/cobertura-json' {
  import { LCOVRecord } from 'parse-lcov';
  export function parseContent(content: string): Promise<LCOVRecord[]>;
}
