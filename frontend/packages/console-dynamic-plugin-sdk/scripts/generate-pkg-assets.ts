import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import type { PackageJson } from 'read-pkg';
import { readPackageSync } from 'read-pkg';
import type { FilesToCopy, FilesToWrite } from './package-definitions';
import { getCorePackage, getInternalPackage, getWebpackPackage } from './package-definitions';
import { resolvePath, relativePath } from './utils/path';

const writePackageManifest = (manifest: PackageJson, outDir: string) => {
  const outPath = resolvePath(`${outDir}/package.json`);
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(chalk.green(relativePath(outPath)));
};

const copyFiles = (files: FilesToCopy) => {
  Object.entries(files).forEach(([src, dest]) => {
    fs.copySync(resolvePath(src), resolvePath(dest), { recursive: true });
    console.log(chalk.green(relativePath(dest)));
  });
};

const writeFiles = (files: FilesToWrite) => {
  files.forEach(({ path: outPath, content }) => {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content);
    console.log(chalk.green(relativePath(outPath)));
  });
};

const sdkPackage = readPackageSync({ normalize: false });
const rootPackage = readPackageSync({ cwd: resolvePath('../..'), normalize: false });

const missingDepNames = new Set<string>();
const missingDepCallback = (name: string) => missingDepNames.add(name);

const outPackages = [getCorePackage, getInternalPackage, getWebpackPackage].map((getPkg) =>
  getPkg(sdkPackage, rootPackage, missingDepCallback),
);

if (missingDepNames.size > 0) {
  console.error(`Failed to parse package dependencies: ${Array.from(missingDepNames).join(', ')}`);
  process.exit(1);
}

outPackages.forEach((pkg) => {
  console.log(`Generating assets for package ${chalk.bold(pkg.manifest.name)}`);

  writePackageManifest(pkg.manifest, pkg.outDir);
  copyFiles(_.mapValues(pkg.filesToCopy, (dest) => `${pkg.outDir}/${dest}`));
  writeFiles((pkg.filesToWrite ?? []).map((f) => ({ ...f, path: `${pkg.outDir}/${f.path}` })));
});
