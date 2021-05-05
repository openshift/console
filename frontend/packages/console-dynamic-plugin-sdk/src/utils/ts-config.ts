import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import { printDiagnostics } from './ts-diagnostics';

export const parseTSConfig = (configFile: string, stripEmitConfiguration = true) => {
  const configFileDir = path.dirname(configFile);
  const configFileText = fs.readFileSync(configFile, 'utf-8');
  const jsonParseResult = ts.parseConfigFileTextToJson(configFile, configFileText);

  if (jsonParseResult.error) {
    printDiagnostics([jsonParseResult.error], configFileDir);
    throw new Error(`Errors while parsing ${configFile}`);
  }

  const configParseResult = ts.parseJsonConfigFileContent(
    jsonParseResult.config,
    ts.sys,
    configFileDir,
    {},
    configFile,
  );

  if (configParseResult.errors.length > 0) {
    printDiagnostics(configParseResult.errors, configFileDir);
    throw new Error(`Errors while parsing ${configFile}`);
  }

  if (stripEmitConfiguration) {
    configParseResult.options.noEmit = true;
    delete configParseResult.options.out;
    delete configParseResult.options.outDir;
    delete configParseResult.options.outFile;
    delete configParseResult.options.declaration;
    delete configParseResult.options.declarationDir;
    delete configParseResult.options.declarationMap;
  }

  return configParseResult;
};
