import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import {
  getCorePackage,
  getInternalPackage,
  getInternalKubevirtPackage,
  getHostAppPackage,
  getWebpackPackage,
} from './package-definitions';
import { resolvePath, relativePath } from './utils/path';

const writePackageManifest = (manifest: readPkg.PackageJson, outDir: string) => {
  const outPath = resolvePath(`${outDir}/package.json`);
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(chalk.green(relativePath(outPath)));
};

const copyFiles = (files: Record<string, string>) => {
  Object.entries(files).forEach(([src, dest]) => {
    fs.copySync(resolvePath(src), resolvePath(dest), { recursive: true });
    console.log(chalk.green(relativePath(dest)));
  });
};

const sdkPackage = readPkg.sync({ normalize: false });
const rootPackage = readPkg.sync({ cwd: resolvePath('../..'), normalize: false });

const missingDepNames = new Set<string>();
const missingDepCallback = (name: string) => missingDepNames.add(name);

const outPackages = [
  getCorePackage(sdkPackage, rootPackage, missingDepCallback),
  getInternalPackage(sdkPackage, rootPackage, missingDepCallback),
  getInternalKubevirtPackage(sdkPackage, rootPackage, missingDepCallback),
  getHostAppPackage(sdkPackage, rootPackage, missingDepCallback),
  getWebpackPackage(sdkPackage, rootPackage, missingDepCallback),
];

if (missingDepNames.size > 0) {
  console.error(`Failed to parse package dependencies: ${Array.from(missingDepNames).join(', ')}`);
  process.exit(1);
}

outPackages.forEach((pkg) => {
  console.log(`Generating assets for package ${chalk.bold(pkg.manifest.name)}`);

  writePackageManifest(pkg.manifest, pkg.outDir);
  copyFiles(_.mapValues(pkg.filesToCopy, (dest) => `${pkg.outDir}/${dest}`));
});
