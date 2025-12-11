/* eslint-disable no-console */
import * as lockfile from '@yarnpkg/lockfile';
import { readFileSync } from 'fs';
import { basename } from 'path';
import chalk from 'chalk';
import * as semver from 'semver';

console.log(`Checking ${chalk.yellow('yarn.lock')} for PatternFly module resolutions...`);

const lockFile = lockfile.parse(readFileSync('yarn.lock', 'utf8'));

if (lockFile.type !== 'success') {
  console.error(`Failed to parse yarn.lock file: type is ${lockFile.type}`);
  process.exit(1);
}

/** List of packages to check along with their expected semver ranges */
const PKGS_TO_CHECK: Array<{ name: string; semver: string }> = [
  { name: '@patternfly-5/patternfly', semver: '*' },
  { name: '@patternfly/patternfly', semver: '6.x' },
  { name: '@patternfly/quickstarts', semver: '6.x' },
  { name: '@patternfly/react-catalog-view-extension', semver: '6.x' },
  { name: '@patternfly/react-charts', semver: '8.x' },
  { name: '@patternfly/react-code-editor', semver: '6.x' },
  { name: '@patternfly/react-component-groups', semver: '6.x' },
  { name: '@patternfly/react-console', semver: '6.x' },
  { name: '@patternfly/react-core', semver: '6.x' },
  { name: '@patternfly/react-data-view', semver: '6.x' },
  { name: '@patternfly/react-icons', semver: '6.x' },
  { name: '@patternfly/react-log-viewer', semver: '6.x' },
  { name: '@patternfly/react-styles', semver: '6.x' },
  { name: '@patternfly/react-table', semver: '6.x' },
  { name: '@patternfly/react-templates', semver: '6.x' },
  { name: '@patternfly/react-tokens', semver: '6.x' },
  { name: '@patternfly/react-topology', semver: '6.x' },
  { name: '@patternfly/react-user-feedback', semver: '6.x' },
  { name: '@patternfly/react-virtualized-extension', semver: '6.x' },
];

const SCOPES_TO_CHECK = new Set(PKGS_TO_CHECK.map((pkg) => pkg.name.split('/')[0]));

/** Get the package name and version from a package key in yarn.lock */
const parsePackageName = (pkgKey: string): { pkgName: string } => {
  const pkgName = PKGS_TO_CHECK.find((pkg) => pkgKey.startsWith(pkg.name));

  // Ensure that all packages within SCOPES_TO_CHECK are checked
  if (!pkgName) {
    throw new Error(
      `Please update ${chalk.yellow(
        basename(__filename),
      )} to handle this PatternFly package: ${chalk.yellow(pkgKey)}`,
    );
  }

  return {
    pkgName: pkgName.name,
  };
};

/** Map of PatternFly packages to their resolved versions in yarn.lock */
const patternflyModules = Object.entries(lockFile.object).reduce((acc, [key, value]) => {
  if (SCOPES_TO_CHECK.has(key.split('/')[0])) {
    const { pkgName } = parsePackageName(key);
    if (!acc.has(pkgName)) {
      acc.set(pkgName, []);
    }
    acc.get(pkgName).push({ resolvedVersion: value.version });
  }

  return acc;
}, new Map<string, Array<{ resolvedVersion: string }>>());

let hasResolutionErrors = false;

for (const pkg of PKGS_TO_CHECK) {
  const resolvedVersions = Array.from(
    new Set(
      (patternflyModules.get(pkg.name) || [])
        .map((v) => v.resolvedVersion)
        .filter((v) => {
          const coerced = semver.coerce(v);
          if (!coerced) {
            console.error(
              `${chalk.red(pkg.name)} has an non-semver coercible resolved version: ${chalk.yellow(
                v,
              )}`,
            );
            hasResolutionErrors = true;
            return false;
          }
          return semver.satisfies(coerced, pkg.semver);
        }),
    ),
  );

  if (resolvedVersions.length === 0) {
    console.error(`${chalk.red(pkg.name)} has no ${chalk.yellow(pkg.semver)} resolutions`);
    hasResolutionErrors = true;
  } else if (resolvedVersions.length === 1) {
    console.log(
      `${chalk.green(pkg.name)} has one ${chalk.yellow(pkg.semver)} resolution: ${
        resolvedVersions[0]
      }`,
    );
  } else {
    console.error(
      `${chalk.red(pkg.name)} has multiple ${chalk.yellow(
        pkg.semver,
      )} resolutions: ${resolvedVersions}`,
    );
    hasResolutionErrors = true;
  }
}

if (hasResolutionErrors) {
  console.error(`Run ${chalk.yellow('yarn why <pkg-name>')} to inspect module resolution details`);
  process.exit(1);
}

console.log(chalk.green('No issues detected'));
