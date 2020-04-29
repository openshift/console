/* eslint-env node */
/* eslint-disable no-console */

import * as path from 'path';
import * as fs from 'fs';
import * as tsj from 'ts-json-schema-generator';
import * as findUp from 'find-up';

type GeneratedSchema = {
  srcFile: string;
  typeName: string;
};

const schemas: GeneratedSchema[] = [
  {
    srcFile: 'src/schema/plugin-package.ts',
    typeName: 'ConsolePluginMetadata',
  },
  {
    srcFile: 'src/schema/console-extensions.ts',
    typeName: 'ConsoleExtensionsJSON',
  },
  {
    srcFile: 'src/schema/plugin-manifest.ts',
    typeName: 'ConsolePluginManifestJSON',
  },
];

const writeSchema = ({ srcFile, typeName }: GeneratedSchema) => {
  const tsjConfig: tsj.Config = {
    path: path.resolve(__dirname, srcFile),
    tsconfig: findUp.sync('tsconfig.json', { cwd: __dirname }),
    topRef: false,
  };

  const schema = tsj.createGenerator(tsjConfig).createSchema(typeName);
  const schemaString = JSON.stringify(schema, null, 2);
  const outPath = path.resolve(__dirname, `dist/schema/${path.parse(srcFile).name}`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(`${outPath}.json`, schemaString);
  fs.writeFileSync(`${outPath}.js`, `export default ${schemaString};`);
};

console.log('Generating Console plugin JSON schemas');
schemas.forEach(writeSchema);
