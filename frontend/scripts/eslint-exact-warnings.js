'use strict';

/**
 * ESLint formatter that enforces an EXACT warning count.
 *
 * Normally, `--max-warnings N` fails the run only when the warning count is
 * GREATER than `N`.
 *
 * It never complains when the count drops below `N`, so a stale, too-high count
 * silently loosens the ratchet and lets regressions creep back in "for free".
 *
 * This formatter enforces an exact warning count, ensuring that the warning count
 * is exactly what is specified, neither more nor less.
 *
 * If it drops below `N`, the count must be lowered in the same change that
 * removed the warnings; if it exceeds `N`, ESLint already fails and we add an
 * actionable hint.
 *
 * A formatter is the only ESLint extension point that sees the aggregate result
 * set for the whole run, while rules cannot see cross-file totals or `--max-warnings`.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load the base formatter used to render normal output. Defaults to the
 * built-in `stylish` formatter; set `ESLINT_CI_BASE_FORMATTER` to the path of a
 * formatter module to use a different one.
 * @returns {import('eslint').ESLint.LoadedFormatter['format']} A raw formatter fn.
 */
const loadBaseFormatter = () => {
  const override = process.env.ESLINT_CI_BASE_FORMATTER;
  if (override) {
    return require(path.resolve(override));
  }
  const eslintDir = path.dirname(require.resolve('eslint/package.json'));
  return require(path.join(eslintDir, 'lib', 'cli-engine', 'formatters', 'stylish.js'));
}

/**
 * Resolve the `MAX_WARNINGS` env var for this run.
 * @returns {number} The warning count.
 */
const getMaxWarnings = () => {
  if (process.env.MAX_WARNINGS === undefined) {
    throw new Error('MAX_WARNINGS is not set. This formatter requires a concrete value to enforce.');
  }
  return Number(process.env.MAX_WARNINGS);
}

/**
 * Count total errors and warnings across all lint results
 * @param {import('eslint').ESLint.LintResult[]} results The lint results.
 * @returns {{ errorCount: number, warningCount: number }}
 */
const countResults = (results) =>
  results.reduce(
    (totals, result) => ({
      errorCount: totals.errorCount + result.errorCount,
      warningCount: totals.warningCount + result.warningCount,
    }),
    { errorCount: 0, warningCount: 0 },
  );

/**
 * Force the run to fail with exit code 1.
 *
 * A formatter cannot change the value `cli.execute()` returns, and the ESLint
 * bin assigns that value to `process.exitCode` *after* the formatter runs. An
 * `'exit'` listener runs later still, so it is the reliable place to set the
 * failing code even when ESLint itself considers the run a pass.
 * @param {string} testName The name of the test case that failed, for JUnit XML output.
 * @param {string} message The error to print to stderr.
 * @returns {void}
 */
const failRun = (message) => {
  process.exitCode = 1;
  process.once('exit', () => {
    process.exitCode = 1;
  });
  process.stderr.write(`\n${message}\n`);

  if (process.env.OPENSHIFT_CI === 'true') {
    const artifactDir = process.env.ARTIFACT_DIR || '/tmp/artifacts';
    const name = 'eslint-exact-warnings';
    const xml = `<?xml version="1.0" encoding="UTF-8"?><testsuites><testsuite name="${name}" tests="1" failures="1"><testcase classname="${name}" name="no eslint errors are present and the current number of warnings matches MAX_WARNINGS"><failure>${message}</failure></testcase></testsuite></testsuites>`;
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(path.join(artifactDir, `${name}.junit.xml`), xml);
  }
};

/** @type {import('eslint').ESLint.LoadedFormatter['format']} */
module.exports = (results, context) => {
  // Pass the original context through so the base formatter keeps ESLint's lazy
  // `rulesMeta` getter (bound to the real engine) and `cwd`.
  const output = loadBaseFormatter()(results, context);

  const maxWarnings = getMaxWarnings();
  const { errorCount, warningCount } = countResults(results);

  if (errorCount > 0) {
    failRun(
      `Found ${errorCount} error(s). All eslint errors must be fixed before merging. Found ${warningCount} warning(s) and expected ${maxWarnings}.`
    );
  } else if (warningCount > maxWarnings) {
    failRun(
      `Found ${warningCount} warning(s), which exceeds the maximum of ${maxWarnings}. Do not increase the MAX_WARNINGS value, instead fix the warning(s) to bring the count back down to ${maxWarnings}.`,
    );
  } else if (warningCount < maxWarnings) {
    failRun(
      `Found ${warningCount} warning(s) but the count is ${maxWarnings}. Lower the MAX_WARNINGS value in the lint script in package.json to match the actual warning count.`
    );
  }

  return output;
};
