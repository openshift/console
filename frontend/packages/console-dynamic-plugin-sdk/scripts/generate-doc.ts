import * as path from 'path';
import * as fs from 'fs';
import * as ejs from 'ejs';
import chalk from 'chalk';
import { getProgramFromFile, printJSDocComments } from './utils/typescript';
import { getConsoleTypeResolver } from './utils/type-resolver';
import { resolvePath, relativePath } from './utils/path';

const getConsoleExtensions = () => {
  const program = getProgramFromFile(resolvePath('src/schema/console-extensions.ts'));
  return getConsoleTypeResolver(program).getConsoleExtensions();
};

const renderTemplate = (srcFile: string, data: {}) => {
  const content = ejs.render(fs.readFileSync(resolvePath(srcFile), 'utf-8'), data, {
    filename: srcFile,
    root: resolvePath('.'),
  });

  const outPath = resolvePath(`dist/doc/${path.parse(srcFile).name}`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);

  console.log(chalk.green(relativePath(outPath)));
};

console.log('Generating Console plugin documentation');

renderTemplate('scripts/templates/console-extensions.md.ejs', {
  extensions: getConsoleExtensions(),
  printComments: printJSDocComments,
  escapeTableCell: (value: string) => value.replace(/\|/g, '\\|'),
});
