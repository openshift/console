import * as fs from 'fs';
import * as ts from 'typescript';
import * as findUp from 'find-up';
import { parseTSConfig } from './ts-config';
import { printDiagnostics } from './ts-diagnostics';

export const getProgram = (
  srcFile: string,
  getConfigFile = () => findUp.sync('tsconfig.json'),
  skipTypeCheck = false,
): ts.Program => {
  const configFile = getConfigFile();

  if (!fs.existsSync(configFile)) {
    throw new Error('Cannot find tsconfig.json');
  }

  const config = parseTSConfig(configFile);
  const program = ts.createProgram([srcFile], config.options);

  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (!skipTypeCheck && diagnostics.length > 0) {
    printDiagnostics(diagnostics, program.getCurrentDirectory());

    const hasErrors = diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error);
    if (hasErrors) {
      throw new Error(`Errors while parsing ${srcFile}`);
    }
  }

  return program;
};
