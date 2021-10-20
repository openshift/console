import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import { sharedPluginModules } from '../src/shared-modules';

type GeneratedPackage = {
  /** Package output directory. */
  outDir: string;
  /** Package manifest. Note: `version` is updated via the publish script. */
  manifest: readPkg.PackageJson;
  /** Additional files to copy to the package output directory. */
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

const commonFiles: GeneratedPackage['filesToCopy'] = {
  '../../../LICENSE': 'LICENSE',
  'README.md': 'README.md',
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
    sharedPluginModules.filter((m) => !m.startsWith('@openshift-console/')),
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
    type: 'module',
    main: 'lib/lib-core.js',
    ...commonManifestFields,
    dependencies: parseSharedModuleDeps(rootPackage, missingDepCallback),
  },
  filesToCopy: {
    ...commonFiles,
    'generated/doc': 'doc',
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
    type: 'module',
    main: 'lib/lib-internal.js',
    ...commonManifestFields,
    dependencies: parseSharedModuleDeps(rootPackage, missingDepCallback),
  },
  filesToCopy: {
    ...commonFiles,
  },
});

export const getInternalKubevirtPackage: GetPackageDefinition = (
  sdkPackage,
  rootPackage,
  missingDepCallback,
) => ({
  outDir: 'dist/internal-kubevirt',
  manifest: {
    name: '@openshift-console/dynamic-plugin-sdk-internal-kubevirt',
    version: sdkPackage.version,
    type: 'module',
    main: 'lib/lib-internal-kubevirt.js',
    ...commonManifestFields,
    dependencies: parseSharedModuleDeps(rootPackage, missingDepCallback),
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
    type: 'commonjs',
    main: 'lib/lib-webpack.js',
    ...commonManifestFields,
    dependencies: {
      ...parseDeps(sdkPackage, ['webpack'], missingDepCallback),
      ...parseDeps(
        rootPackage,
        ['ajv', 'chalk', 'comment-json', 'find-up', 'read-pkg', 'semver'],
        missingDepCallback,
      ),
      ...parseDepsAs(rootPackage, { 'lodash-es': 'lodash' }, missingDepCallback),
    },
  },
  filesToCopy: {
    ...commonFiles,
    'generated/schema': 'schema',
  },
});
