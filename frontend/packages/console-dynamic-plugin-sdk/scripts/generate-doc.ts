import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as ejs from 'ejs';
import { resolvePath, relativePath } from './utils/path';
import { ExtensionTypeInfo, getConsoleTypeResolver } from './utils/type-resolver';
import { getProgramFromFile, printJSDocComments } from './utils/typescript';

const getConsoleExtensions = () => {
  const program = getProgramFromFile(resolvePath('src/schema/console-extensions.ts'));
  return getConsoleTypeResolver(program).getConsoleExtensions(true).result;
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
  extensions: getConsoleExtensions()
    // Sort extensions by their `type` value
    .sort((a, b) => a.type.localeCompare(b.type))
    // Sort extension properties by their optional modifier
    .map<ExtensionTypeInfo>((e) => ({
      ...e,
      properties: e.properties.sort((a, b) =>
        a.optional === b.optional ? 0 : a.optional ? 1 : -1,
      ),
    })),
  printComments: (docComments: string[]) => printJSDocComments(docComments).replace(/\n/g, '<br/>'),
  escapeTableCell: (value: string) => value.replace(/\|/g, '\\|'),
});
