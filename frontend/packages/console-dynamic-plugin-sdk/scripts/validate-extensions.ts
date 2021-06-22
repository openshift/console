import chalk from 'chalk';
import { getProgram } from '../src/utils/ts-program';
import { getConsoleTypeResolver } from './utils/type-resolver';
import { resolvePath } from './utils/path';

const getConsoleExtensionDiagnostics = () => {
  const program = getProgram(resolvePath('src/schema/console-extensions.ts'));
  return getConsoleTypeResolver(program).getConsoleExtensions().diagnostics;
};

const printMessages = (
  description: string,
  messages: string[],
  messageFormatter: (msg: string) => string,
) => {
  const prefix = `${chalk.bold(description)} (${messages.length})\n`;
  const messageLines = messages.map((msg) => `    ${messageFormatter(msg)}`);
  console.log(`${prefix}${messageLines.join('\n')}`);
};

console.log('Validating Console extension types');

const { errors, warnings } = getConsoleExtensionDiagnostics();

if (errors.length > 0) {
  printMessages('Errors', errors, (msg) => `${chalk.red(msg)}`);
  process.exitCode = 1;
}

if (warnings.length > 0) {
  printMessages('Warnings', warnings, (msg) => `${chalk.yellow(msg)}`);
}

if (errors.length === 0 && warnings.length === 0) {
  console.log(chalk.green('No issues detected'));
}
