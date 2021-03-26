import * as fs from 'fs';
import * as readPkg from 'read-pkg';

const PKG_NAME = '@openshift-console/dynamic-plugin-sdk';
const EXTENSIONS_EXPORT = 'lib/extensions/index.js';
const WEBPACK_PLUGIN_EXPORTS = './lib/webpack/ConsoleRemotePlugin.js';
const API_EXPORT = './lib/api/api.js';

const createPackageJson = () => {
  const packageJson = readPkg.sync({ normalize: false });
  packageJson.name = PKG_NAME;
  delete packageJson.private;
  packageJson.license = 'Apache-2.0';
  packageJson.main = EXTENSIONS_EXPORT;
  packageJson.exports = {
    './': `./${EXTENSIONS_EXPORT}`,
    './webpack': WEBPACK_PLUGIN_EXPORTS,
    './api': API_EXPORT,
  };
  packageJson.readme = './README.md';
  packageJson.peerDependencies = packageJson.dependencies;
  delete packageJson.dependencies;
  delete packageJson.devDependencies;
  delete packageJson.scripts;
  fs.writeFileSync(`dist/package.json`, JSON.stringify(packageJson, null, 2));
};

createPackageJson();
