/* eslint-disable no-console */
import { parseSyml } from '@yarnpkg/parsers';
import { readFileSync } from 'fs';
import { basename } from 'path';
import chalk from 'chalk';
import * as semver from 'semver';

console.log(`Checking ${chalk.yellow('yarn.lock')} for PatternFly module resolutions...`);

const lockFileContent = readFileSync('yarn.lock', 'utf8');
const lockFile = parseSyml(lockFileContent);

/** List of packages to check along with their required semver ranges */
const PKGS_TO_CHECK: Array<{ name: string; semver: string }> = [
  { name: '@patternfly/patternfly', semver: '6.x' },
  { name: '@patternfly/quickstarts', semver: '6.x' },
  { name: '@patternfly/react-catalog-view-extension', semver: '6.x' },
  { name: '@patternfly/react-charts', semver: '8.x' },
  { name: '@patternfly/react-code-editor', semver: '6.x' },
  { name: '@patternfly/react-component-groups', semver: '6.x' },
  { name: '@patternfly/react-core', semver: '6.x' },
  { name: '@patternfly/react-data-view', semver: '6.x' },
  { name: '@patternfly/react-drag-drop', semver: '6.x' },
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
const parsePackageName = (resolutionKey: string): string | null => {
  // e.g., `${@patternfly/react-core}@^6.0.0`
  const pkgName = PKGS_TO_CHECK.find((pkg) => resolutionKey.startsWith(`${pkg.name}@`));

  // Ensure that all packages within SCOPES_TO_CHECK are checked
  if (!pkgName && SCOPES_TO_CHECK.has(resolutionKey.split('/')[0])) {
    throw new Error(
      `Please update ${chalk.yellow(
        basename(__filename),
      )} to handle this PatternFly package: ${chalk.yellow(resolutionKey)}`,
    );
  }

  return pkgName?.name ?? null;
};

/** Map of PatternFly packages to their resolved versions in yarn.lock */
const patternflyModules = Object.entries(lockFile).reduce(
  (acc, [resolutionKey, resolvedDependency]) => {
    if (SCOPES_TO_CHECK.has(resolutionKey.split('/')[0])) {
      const pkgName = parsePackageName(resolutionKey);
      if (!acc.has(pkgName)) {
        acc.set(pkgName, []);
      }
      acc.get(pkgName).push({ resolvedVersion: resolvedDependency.version });
    }

    return acc;
  },
  new Map<string, Array<{ resolvedVersion: string }>>(),
);

let hasResolutionErrors = false;

for (const pkg of PKGS_TO_CHECK) {
  const resolvedVersions = Array.from(
    new Set((patternflyModules.get(pkg.name) || []).map((v) => v.resolvedVersion)),
  );

  if (resolvedVersions.length === 0) {
    console.error(`${chalk.red(pkg.name)} has no ${chalk.yellow(pkg.semver)} resolutions`);
    hasResolutionErrors = true;
  } else if (resolvedVersions.length === 1) {
    const resolvedVersion = semver.coerce(resolvedVersions[0]);

    if (!resolvedVersion) {
      console.error(
        `${chalk.red(pkg.name)} has a non-semver coercible resolved version: ${chalk.yellow(
          resolvedVersions[0],
        )}`,
      );
      hasResolutionErrors = true;
      continue;
    }

    if (!semver.satisfies(resolvedVersion, pkg.semver)) {
      console.error(
        `${chalk.red(pkg.name)} has one resolution ${chalk.yellow(
          resolvedVersions[0],
        )} which does not satisfy ${chalk.yellow(pkg.semver)}`,
      );
      hasResolutionErrors = true;
    } else {
      console.log(
        `${chalk.green(pkg.name)} has one ${chalk.yellow(pkg.semver)} resolution: ${
          resolvedVersions[0]
        }`,
      );
    }
  } else {
    console.error(`${chalk.red(pkg.name)} has multiple resolutions: ${resolvedVersions}`);
    hasResolutionErrors = true;
  }
}

if (hasResolutionErrors) {
  console.error(`Run ${chalk.yellow('yarn why <pkg-name>')} to inspect module resolution details`);
  process.exit(1);
}

console.log(chalk.green('No issues detected'));
