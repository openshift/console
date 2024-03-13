import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import { sharedPluginModules, getSharedModuleMetadata } from '../src/shared-modules';
import { resolvePath } from './utils/path';

type GeneratedPackage = {
  /** Package output directory. */
  outDir: string;
  /** Package manifest. Note: `version` is updated via the publish script. */
  manifest: readPkg.PackageJson;
  /** Additional files or directories to copy to the package output directory. */
  filesToCopy: Record<string, string>;
};

type MissingDependencyCallback = (name: string) => void;

type GetPackageDefinition = (
  sdkPackage: readPkg.PackageJson,
  rootPackage: readPkg.PackageJson,
  missingDepCallback: MissingDependencyCallback,
) => GeneratedPackage;

const commonManifestFields: Partial<readPkg.PackageJson> = {
  license: 'Apache-2.0',
  homepage:
    'https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk',
  keywords: ['openshift', 'console', 'plugin'],
};

const commonFiles: Record<string, string> = {
  '../../../LICENSE': 'LICENSE',
  'README.md': 'README.md',
};

const docFiles: Record<string, string> = {
  docs: 'docs',
  'upgrade-PatternFly.md': 'upgrade-PatternFly.md',
};

const getReferencedAssets = (outDir: string) => {
  const baseDir = resolvePath(`${outDir}/lib`);
  const jsFiles = glob.sync('**/*.js', { cwd: baseDir, absolute: true });
  const importPattern = /^(?:import|import .* from) '(.*)';$/gm;

  const assetExtensions = ['.scss'];
  const filesToCopy: Record<string, string> = {};

  jsFiles.forEach((filePath) => {
    for (const match of fs.readFileSync(filePath, 'utf-8').matchAll(importPattern)) {
      const moduleSpecifier = match[1];

      if (
        moduleSpecifier.startsWith('.') &&
        assetExtensions.some((ext) => moduleSpecifier.endsWith(ext))
      ) {
        const assetPath = path.resolve(path.dirname(filePath), moduleSpecifier);
        const assetRelativePath = path.relative(resolvePath(baseDir), assetPath);

        filesToCopy[`src/${assetRelativePath}`] = `lib/${assetRelativePath}`;
      }
    }
  });

  return filesToCopy;
};

const parseDeps = (
  pkg: readPkg.PackageJson,
  depNames: string[],
  missingDepCallback: MissingDependencyCallback,
) => {
  const srcDeps = { ...pkg.devDependencies, ...pkg.dependencies };
  depNames.filter((name) => !srcDeps[name]).forEach(missingDepCallback);
  return _.pick(srcDeps, depNames);
};

const parseDepsAs = (
  pkg: readPkg.PackageJson,
  deps: { [depName: string]: string },
  missingDepCallback: MissingDependencyCallback,
) => _.mapKeys(parseDeps(pkg, Object.keys(deps), missingDepCallback), (value, key) => deps[key]);

const parseSharedModuleDeps = (
  pkg: readPkg.PackageJson,
  missingDepCallback: MissingDependencyCallback,
) =>
  parseDeps(
    pkg,
    sharedPluginModules.filter(
      (m) => !m.startsWith('@openshift-console/') && !getSharedModuleMetadata(m).allowFallback,
    ),
    missingDepCallback,
  );

export const getCorePackage: GetPackageDefinition = (
  sdkPackage,
  rootPackage,
  missingDepCallback,
) => ({
  outDir: 'dist/core',
  manifest: {
    name: '@openshift-console/dynamic-plugin-sdk',
    version: sdkPackage.version,
    main: 'lib/lib-core.js',
    ...commonManifestFields,
    dependencies: {
      ...parseSharedModuleDeps(rootPackage, missingDepCallback),
      ...parseDeps(
        rootPackage,
        ['classnames', 'immutable', 'reselect', 'typesafe-actions', 'whatwg-fetch'],
        missingDepCallback,
      ),
      ...parseDepsAs(rootPackage, { 'lodash-es': 'lodash' }, missingDepCallback),
    },
  },
  filesToCopy: {
    ...commonFiles,
    ...docFiles,
    ...getReferencedAssets('dist/core'),
  },
});

export const getInternalPackage: GetPackageDefinition = (
  sdkPackage,
  rootPackage,
  missingDepCallback,
) => ({
  outDir: 'dist/internal',
  manifest: {
    name: '@openshift-console/dynamic-plugin-sdk-internal',
    version: sdkPackage.version,
    main: 'lib/lib-internal.js',
    ...commonManifestFields,
    dependencies: {
      ...parseSharedModuleDeps(rootPackage, missingDepCallback),
      ...parseDeps(rootPackage, ['immutable'], missingDepCallback),
    },
  },
  filesToCopy: {
    ...commonFiles,
  },
});

export const getWebpackPackage: GetPackageDefinition = (
  sdkPackage,
  rootPackage,
  missingDepCallback,
) => ({
  outDir: 'dist/webpack',
  manifest: {
    name: '@openshift-console/dynamic-plugin-sdk-webpack',
    version: sdkPackage.version,
    main: 'lib/lib-webpack.js',
    ...commonManifestFields,
    dependencies: {
      ...parseDeps(
        sdkPackage,
        ['@openshift/dynamic-plugin-sdk-webpack', 'webpack'],
        missingDepCallback,
      ),
      ...parseDeps(
        rootPackage,
        ['ajv', 'chalk', 'comment-json', 'find-up', 'glob', 'read-pkg', 'semver'],
        missingDepCallback,
      ),
      ...parseDepsAs(rootPackage, { 'lodash-es': 'lodash' }, missingDepCallback),
    },
    peerDependencies: {
      typescript: '>=4.5.5',
    },
  },
  filesToCopy: {
    ...commonFiles,
    'generated/schema': 'schema',
  },
});
