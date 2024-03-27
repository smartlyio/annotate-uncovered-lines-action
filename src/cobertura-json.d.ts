declare module '@cvrg-report/cobertura-json' {
  export function parseContent(content: string): Promise<
    {
      title: string;
      file: string;
      lines: {
        details: {
          line: number;
          hit: number;
        }[];
      };
    }[]
  >;
}
