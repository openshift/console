import * as path from 'path';
import * as fs from 'fs';
import * as findUp from 'find-up';
import * as tsj from 'ts-json-schema-generator';
import chalk from 'chalk';
import { ConstructorTypeNodeParser } from './generate-schema.parsers';

type GeneratedSchema = {
  srcFile: string;
  type: string;
};

const schemas: GeneratedSchema[] = [
  { srcFile: 'src/schema/plugin-package.ts', type: 'ConsolePluginMetadata' },
  { srcFile: 'src/schema/console-extensions.ts', type: 'ConsoleExtensionsJSON' },
  { srcFile: 'src/schema/plugin-manifest.ts', type: 'ConsolePluginManifestJSON' },
];

const resolvePath = (to: string, from = process.cwd()) => path.resolve(from, to);

const newGenerator = (gs: GeneratedSchema): tsj.SchemaGenerator => {
  const config: tsj.Config = {
    path: resolvePath(gs.srcFile),
    tsconfig: findUp.sync('tsconfig.json'),
    type: gs.type,
    topRef: false,
  };

  const program = tsj.createProgram(config);
  const parser = tsj.createParser(program, config, (p) => {
    p.addNodeParser(new ConstructorTypeNodeParser());
  });

  const formatter = tsj.createFormatter(config);
  return new tsj.SchemaGenerator(program, parser, formatter, config);
};

const writeSchema = (gs: GeneratedSchema) => {
  const schema = newGenerator(gs).createSchema(gs.type);
  const schemaString = JSON.stringify(schema, null, 2);
  const outPath = resolvePath(`dist/schema/${path.parse(gs.srcFile).name}`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(`${outPath}.json`, schemaString);
  fs.writeFileSync(`${outPath}.js`, `export default ${schemaString};`);
};

console.log('Generating Console plugin JSON schemas');

schemas.forEach((gs, index) => {
  console.log(
    `[${index + 1}/${schemas.length}] ${chalk.cyan(gs.srcFile)}:${chalk.bold.cyan(gs.type)}`,
  );

  writeSchema(gs);
});
