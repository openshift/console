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
 * @param {string} message The error to print to stderr.
 * @returns {void}
 */
const failRun = (message) => {
  process.exitCode = 1;
  process.once('exit', () => {
    process.exitCode = 1;
  });
  process.stderr.write(`\n${message}\n`);
};

/** @type {import('eslint').ESLint.LoadedFormatter['format']} */
module.exports = (results, context) => {
  // Pass the original context through so the base formatter keeps ESLint's lazy
  // `rulesMeta` getter (bound to the real engine) and `cwd`.
  const output = loadBaseFormatter()(results, context);

  const maxWarnings = getMaxWarnings();
  const { errorCount, warningCount } = countResults(results);

  // Already fails if there are errors
  if (errorCount > 0 || warningCount === maxWarnings) {
    return output;
  }

  if (warningCount > maxWarnings) {
    // ESLint already fails this case; add an actionable hint.
    failRun(
      `Found ${warningCount} warning(s), which exceeds the maximum of ${maxWarnings}. Do not increase the MAX_WARNINGS value, instead fix the warning(s) to bring the count back down to ${maxWarnings}.`,
    );
    return output;
  }

  // warningCount < maxWarnings
  failRun(
    `Found ${warningCount} warning(s) but the count is ${maxWarnings}. Lower the MAX_WARNINGS value in the lint script in package.json to match the actual warning count.`
  );
  return output;
};
