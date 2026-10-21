import * as fs from 'fs';
import * as path from 'path';
import * as findUp from 'find-up';

export const loadSchema = (relativePath: string) => {
  const pkgDir = path.dirname(findUp.sync('package.json', { cwd: __dirname }));

  const schemaPath = [
    path.resolve(pkgDir, 'schema'),
    path.resolve(pkgDir, 'generated/schema'),
  ].find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());

  // eslint-disable-next-line
  return require(path.resolve(schemaPath, relativePath));
};
