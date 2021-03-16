import chalk from 'chalk';
import { getProgramFromFile, printJSDocComments } from './utils/typescript';
import { getConsoleTypeResolver } from './utils/type-resolver';
import { resolvePath } from './utils/path';

const validateConsoleExtensions = () => {
  const program = getProgramFromFile(resolvePath('src/schema/console-extensions.ts'));

  const errors: string[] = [];
  const warnings: string[] = [];

  const consoleExtensions = getConsoleTypeResolver(program).getConsoleExtensions((errorMessage) => {
    errors.push(errorMessage);
  });

  const checkComments = (prefix: string, docComments: string[]) => {
    if (!printJSDocComments(docComments)) {
      warnings.push(`${prefix} has no JSDoc comments`);
    }
  };

  consoleExtensions.forEach((e) => {
    checkComments(`Extension type '${e.name}'`, e.docComments);

    e.properties.forEach((p) => {
      checkComments(`Extension type '${e.name}' property '${p.name}'`, p.docComments);
    });
  });

  return { errors, warnings };
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

const { errors, warnings } = validateConsoleExtensions();

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
