import * as _ from 'lodash';
import * as readPkg from 'read-pkg';
import { getSharedPluginModules } from '../src/shared-modules';

type GeneratedPackage = {
  /** Package output directory. */
  outDir: string;
  /** Package manifest. Note: `version` is updated via the publish script. */
  manifest: readPkg.PackageJson;
  /** Additional files to copy to the package output directory. */
  filesToCopy: Record<any, string>;
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
};

const commonFiles: GeneratedPackage['filesToCopy'] = {
  '../../../LICENSE': 'LICENSE',
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
    dependencies: parseDeps(rootPackage, getSharedPluginModules(false), missingDepCallback),
  },
  filesToCopy: {
    ...commonFiles,
    'README.md': 'README.md',
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
    dependencies: getCorePackage(sdkPackage, rootPackage, missingDepCallback).manifest.dependencies,
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
