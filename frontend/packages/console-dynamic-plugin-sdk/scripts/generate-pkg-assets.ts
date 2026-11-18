import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import type { PackageJson } from 'read-pkg';
import { readPackageSync } from 'read-pkg';
import { parseJSONC } from '../src/utils/jsonc';
import type { FilesToCopy, FilesToWrite } from './package-definitions';
import { getCorePackage, getInternalPackage, getWebpackPackage } from './package-definitions';
import { rewriteRelativePathLinks } from './utils/markdown';
import { resolvePath, relativePath } from './utils/path';

const gitBranch = parseJSONC('console-meta.jsonc')['git-branch'];

const getRepoFilePath = (file: string) => path.relative(resolvePath('../../..'), file);

const getConsoleRepoURL = (file: string) =>
  `https://github.com/openshift/console/tree/${gitBranch}/${getRepoFilePath(file)}`;

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

const updateMarkdownFiles = (files: string[]) => {
  files.map(resolvePath).forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      content = rewriteRelativePathLinks(content, (p) => getConsoleRepoURL(p));
      fs.writeFileSync(filePath, content);
      console.log(chalk.green(relativePath(filePath)));
    }
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
  console.log(`Generating assets: ${chalk.bold(pkg.manifest.name)}`);

  writePackageManifest(pkg.manifest, pkg.outDir);
  copyFiles(_.mapValues(pkg.filesToCopy, (dest) => `${pkg.outDir}/${dest}`));
  writeFiles((pkg.filesToWrite ?? []).map((f) => ({ ...f, path: `${pkg.outDir}/${f.path}` })));

  console.log(`Updating assets: ${chalk.bold(pkg.manifest.name)}`);

  updateMarkdownFiles((pkg.markdownFilesToUpdate ?? []).map((f) => `${pkg.outDir}/${f}`));
});
