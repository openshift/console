// @ts-check
'use strict';

/**
 * Oxlint output post-processor that enforces an EXACT warning count.
 *
 * Mirrors scripts/eslint-exact-warnings.cjs: `--max-warnings N` only fails
 * when the count GROWS, so a stale, too-high budget silently loosens the
 * ratchet. This script fails when the count is not exactly `MAX_WARNINGS`,
 * forcing the budget to be lowered in the same change that removed
 * warnings. Oxlint does not support custom formatters, so it is fed via
 * `oxlint -f json . | node ./scripts/oxlint-exact-warnings.cjs`.
 *
 * When MAX_WARNINGS is not set the run only reports (and still fails on
 * any error-level diagnostic).
 */

const getMaxWarnings = () => {
  if (process.env.MAX_WARNINGS === undefined) {
    return undefined;
  }
  const n = Number(process.env.MAX_WARNINGS);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`MAX_WARNINGS must be a non-negative integer, got "${process.env.MAX_WARNINGS}".`);
  }
  return n;
};

const readStdin = () =>
  new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });

const main = async () => {
  const maxWarnings = getMaxWarnings();
  let run;
  try {
    run = JSON.parse(await readStdin());
  } catch (e) {
    console.error(`Failed to parse oxlint JSON output: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  const errors = run.diagnostics.filter((d) => d.severity === 'error');
  const warnings = run.diagnostics.filter((d) => d.severity === 'warning');

  for (const d of run.diagnostics) {
    const [label] = d.labels || [];
    const loc = label ? `${d.filename}:${label.span.line}:${label.span.column}` : d.filename;
    console.log(`${loc}  ${d.severity}  ${d.code}  ${d.message}`);
  }
  console.log(`\noxlint: ${run.number_of_files} files, ${errors.length} error(s), ${warnings.length} warning(s)`);

  if (errors.length > 0) {
    console.error(
      `Found ${errors.length} error(s). All oxlint errors must be fixed before merging. Found ${warnings.length} warning(s).`,
    );
    process.exitCode = 1;
    return;
  }
  if (maxWarnings === undefined) {
    return;
  }
  if (warnings.length > maxWarnings) {
    console.error(
      `Found ${warnings.length} warning(s), which exceeds the maximum of ${maxWarnings}. Do not increase the MAX_WARNINGS value, instead fix the warning(s) to bring the count back down to ${maxWarnings}.`,
    );
    process.exitCode = 1;
  } else if (warnings.length < maxWarnings) {
    console.error(
      `Found ${warnings.length} warning(s) but the count is ${maxWarnings}. Lower the MAX_WARNINGS value in the lint script in package.json to match the actual warning count.`,
    );
    process.exitCode = 1;
  }
};

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
