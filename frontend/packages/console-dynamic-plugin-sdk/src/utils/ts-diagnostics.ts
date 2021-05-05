import * as ts from 'typescript';
import * as _ from 'lodash';

const formatDiagnostics = (diagnostics: readonly ts.Diagnostic[], currentDir: string) =>
  ts.formatDiagnosticsWithColorAndContext(ts.sortAndDeduplicateDiagnostics(diagnostics), {
    getCurrentDirectory: () => currentDir,
    getCanonicalFileName: _.identity,
    getNewLine: () => ts.sys.newLine,
  });

export const printDiagnostics = (...args: Parameters<typeof formatDiagnostics>) => {
  // eslint-disable-next-line no-console
  console.error(formatDiagnostics(...args));
};
