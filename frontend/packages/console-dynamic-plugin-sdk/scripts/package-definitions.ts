import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';
import type { PackageJson } from 'read-pkg';
import * as semver from 'semver';
import type { ConsolePluginSharedModuleVersions } from '../src/build-types';
import {
  sharedPluginModules,
  getSharedModuleMetadata,
} from '../src/shared-modules/console-shared-modules';
import { sharedDynamicModules } from '../src/shared-modules/dynamic-shared-modules';
import { resolvePath } from './utils/path';

export type FilesToCopy = Record<string, string>;

export type FilesToWrite = { path: string; content: string }[];

type GeneratedPackage = {
  /** Package output directory. */
  outDir: string;
  /** Package manifest. Note: `version` must be set before publishing. */
  manifest: PackageJson;
  /** Additional files or directories to copy to the package output directory. */
  filesToCopy?: FilesToCopy;
  /** Additional files to write to the package output directory. */
  filesToWrite?: FilesToWrite;
};

type MissingDependencyCallback = (name: string) => void;

type GetPackageDefinition = (
  sdkPackage: PackageJson,
  rootPackage: PackageJson,
  missingDepCallback: MissingDependencyCallback,
) => GeneratedPackage;

const commonManifestFields: Partial<PackageJson> = {
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
  pkg: PackageJson,
  depNames: string[],
  missingDepCallback: MissingDependencyCallback,
) => {
  const srcDeps = { ...pkg.devDependencies, ...pkg.dependencies };
  depNames.filter((name) => !srcDeps[name]).forEach(missingDepCallback);
  return _.pick(srcDeps, depNames);
};

const parseDepsAs = (
  pkg: PackageJson,
  deps: { [depName: string]: string },
  missingDepCallback: MissingDependencyCallback,
) => _.mapKeys(parseDeps(pkg, Object.keys(deps), missingDepCallback), (value, key) => deps[key]);

const parseConsoleProvidedSharedModuleDeps = (
  pkg: PackageJson,
  missingDepCallback: MissingDependencyCallback,
) =>
  parseDeps(
    pkg,
    sharedPluginModules.filter((m) => {
      const { allowFallback, aliased } = getSharedModuleMetadata(m);

      return (
        // Exclude Console plugin SDK shared modules.
        !m.startsWith('@openshift-console/') &&
        // This is a Console plugin SDK dependency and a shared module.
        m !== '@openshift/dynamic-plugin-sdk' &&
        // Include only modules with the following configuration:
        // - plugins can NOT provide their own fallback version of the module
        // - module's implementation is NOT aliased to another module at runtime
        !allowFallback &&
        !aliased
      );
    }),
    missingDepCallback,
  );

const getConsolePluginSharedModuleVersions = (
  pkg: PackageJson,
  missingDepCallback: MissingDependencyCallback,
): ConsolePluginSharedModuleVersions => ({
  console: parseConsoleProvidedSharedModuleDeps(pkg, missingDepCallback),
  dynamic: parseDeps(pkg, sharedDynamicModules, missingDepCallback),
});

const getMinDepVersion = (
  pkg: PackageJson,
  depName: string,
  missingDepCallback: MissingDependencyCallback,
) => {
  const versionOrRange = parseDeps(pkg, [depName], missingDepCallback)[depName];
  return semver.minVersion(versionOrRange).version;
};

export const getCorePackage: GetPackageDefinition = (
  sdkPackage,
  rootPackage,
  missingDepCallback,
) => ({
  outDir: 'dist/core',
  manifest: {
    name: '@openshift-console/dynamic-plugin-sdk',
    version: sdkPackage.version,
    description: 'Provides core APIs, types and utilities used by dynamic plugins at runtime.',
    main: 'lib/lib-core.js',
    ...commonManifestFields,
    dependencies: {
      ...parseDeps(
        rootPackage,
        ['@openshift/api-types', '@openshift/dynamic-plugin-sdk', 'reselect', 'typesafe-actions'],
        missingDepCallback,
      ),
      ...parseDepsAs(rootPackage, { 'lodash-es': 'lodash' }, missingDepCallback),
    },
    peerDependencies: { ...parseConsoleProvidedSharedModuleDeps(rootPackage, missingDepCallback) },
    peerDependenciesMeta: _.mapValues(
      parseConsoleProvidedSharedModuleDeps(rootPackage, missingDepCallback),
      () => ({ optional: true }),
    ),
  },
  filesToCopy: {
    ...commonFiles,
    ...docFiles,
    ...getReferencedAssets('dist/core'),
    'CHANGELOG-core.md': 'CHANGELOG.md',
  },
  filesToWrite: [
    {
      path: 'meta/shared-modules.json',
      content: JSON.stringify(
        getConsolePluginSharedModuleVersions(rootPackage, missingDepCallback),
        null,
        2,
      ),
    },
  ],
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
    description: 'Internal package exposing additional Console code. No API stability guarantees.',
    main: 'lib/lib-internal.js',
    ...commonManifestFields,
    dependencies: {
      ...parseDeps(rootPackage, ['@openshift/dynamic-plugin-sdk'], missingDepCallback),
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
    description: 'Provides webpack ConsoleRemotePlugin used to build all dynamic plugin assets.',
    main: 'lib/lib-webpack.js',
    ...commonManifestFields,
    dependencies: {
      ...parseDeps(
        rootPackage,
        [
          '@openshift/dynamic-plugin-sdk',
          '@openshift/dynamic-plugin-sdk-webpack',
          'ajv',
          'chalk',
          'comment-json',
          'find-up',
          'glob',
          'read-pkg',
          'semver',
        ],
        missingDepCallback,
      ),
      ...parseDepsAs(rootPackage, { 'lodash-es': 'lodash' }, missingDepCallback),
    },
    peerDependencies: {
      '@rspack/core': `>=${getMinDepVersion(rootPackage, '@rspack/core', missingDepCallback)}`,
      typescript: `>=${getMinDepVersion(rootPackage, 'typescript', missingDepCallback)}`,
      webpack: `>=${getMinDepVersion(rootPackage, 'webpack', missingDepCallback)}`,
    },
    peerDependenciesMeta: {
      '@rspack/core': { optional: true },
      webpack: { optional: true },
    },
  },
  filesToCopy: {
    ...commonFiles,
    'generated/schema': 'schema',
    'CHANGELOG-webpack.md': 'CHANGELOG.md',
  },
});
