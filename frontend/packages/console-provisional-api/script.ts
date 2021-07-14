import * as path from 'path';
import * as fs from 'fs-extra';
import * as readPkg from 'read-pkg';

const resolvePath = (to: string) => path.resolve(process.cwd(), to);

const addPackageJson = () => {
  const pkg = readPkg.sync({ normalize: false });
  pkg.main = './lib/index.js';
  pkg.exports = {
    '.': './lib/index.js',
  };
  delete pkg.scripts;
  fs.writeFileSync(resolvePath('dist/package.json'), JSON.stringify(pkg, null, 2));
};

addPackageJson();
