import * as path from 'path';
import * as fs from 'fs';
import * as tsj from 'ts-json-schema-generator';
import chalk from 'chalk';
import { getProgram } from '../src/utils/ts-program';
import { ConstructorTypeParser } from './parsers/ConstructorTypeParser';
import { CodeRefTypeReferenceParser } from './parsers/CodeRefTypeReferenceParser';
import { ExtensionDeclarationParser } from './parsers/ExtensionDeclarationParser';
import { getConsoleTypeResolver } from './utils/type-resolver';
import { resolvePath, relativePath } from './utils/path';

type SchemaTypeConfig = {
  srcFile: string;
  typeName: string;
  /** Set to `true` when the generated schema references SupportedExtension union type. */
  handleConsoleExtensions?: boolean;
};

const typeConfigs: SchemaTypeConfig[] = [
  {
    srcFile: 'src/schema/plugin-package.ts',
    typeName: 'ConsolePluginMetadata',
  },
  {
    srcFile: 'src/schema/console-extensions.ts',
    typeName: 'ConsoleExtensionsJSON',
    handleConsoleExtensions: true,
  },
  {
    srcFile: 'src/schema/plugin-manifest.ts',
    typeName: 'ConsolePluginManifestJSON',
    handleConsoleExtensions: true,
  },
];

const getSchemaGeneratorOutputConfig = (typeName: string): tsj.Config => ({
  type: typeName,
  topRef: false,
  jsDoc: 'extended',
});

const generateSchema = ({ srcFile, typeName, handleConsoleExtensions }: SchemaTypeConfig) => {
  const config = getSchemaGeneratorOutputConfig(typeName);
  const program = getProgram(srcFile);
  const typeChecker = program.getTypeChecker();
  const annotationsReader = new tsj.ExtendedAnnotationsReader(typeChecker);
  const consoleTypeResolver = getConsoleTypeResolver(program);

  const parser = tsj.createParser(program, config, (p) => {
    p.addNodeParser(new ConstructorTypeParser());

    if (handleConsoleExtensions) {
      const consoleTypeDeclarations = consoleTypeResolver.getDeclarations();
      const consoleExtensions = consoleTypeResolver.getConsoleExtensions(true).result;
      const getMainParser = () => parser;

      p.addNodeParser(
        new CodeRefTypeReferenceParser(typeChecker, consoleTypeDeclarations, getMainParser),
      );
      p.addNodeParser(
        new ExtensionDeclarationParser(annotationsReader, consoleExtensions, getMainParser),
      );
    }
  });

  const formatter = tsj.createFormatter(config);
  const generator = new tsj.SchemaGenerator(program, parser, formatter, config);

  return generator.createSchema(typeName);
};

console.log('Generating Console plugin JSON schemas');

typeConfigs.forEach((tc) => {
  const schema = generateSchema(tc);
  const schemaString = JSON.stringify(schema, null, 2);
  const outPath = resolvePath(`schema/${path.parse(tc.srcFile).name}`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(`${outPath}.json`, schemaString);
  fs.writeFileSync(`${outPath}.js`, `export default ${schemaString};`);

  console.log(chalk.green(relativePath(`${outPath}.json`)));
  console.log(chalk.green(relativePath(`${outPath}.js`)));
});
