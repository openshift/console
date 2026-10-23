// @ts-check
'use strict';

/**
 * Runs oxlint and enforces an EXACT warning count.
 *
 * Spawns `oxlint -f json` and forwards all arguments, so `yarn oxlint
 * <path>` (or `--fix`, etc.) applies to that path instead of the whole
 * repo. Yarn appends extra arguments to the end of a script string, so a
 * plain `oxlint -f json . | node …` pipeline would send them to the wrong
 * command.
 *
 * A warning ceiling alone only fails when the count grows, so a stale
 * budget silently loosens the ratchet. This script instead fails unless
 * the count is exactly `MAX_WARNINGS`, forcing the budget to be lowered in
 * the same change that removes warnings.
 *
 * When MAX_WARNINGS is not set the run only reports (and still fails on any
 * error-level diagnostic). When OPENSHIFT_CI=true, a junit XML artifact is
 * written to ARTIFACT_DIR so the result shows up as a test case in CI
 * reporting.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const oxlintBin = path.join(root, 'node_modules', '.bin', 'oxlint');

const getMaxWarnings = () => {
  if (process.env.MAX_WARNINGS === undefined) {
    return undefined;
  }
  const n = Number(process.env.MAX_WARNINGS);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(
      `MAX_WARNINGS must be a non-negative integer, got "${process.env.MAX_WARNINGS}".`,
    );
  }
  return n;
};

/**
 * Runs oxlint with the JSON formatter and resolves with its stdout.
 * @param {string[]} args
 * @returns {Promise<string>}
 */
const runOxlint = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(oxlintBin, ['-f', 'json', ...args], {
      stdio: ['inherit', 'pipe', 'inherit'],
    });
    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.on('error', reject);
    child.on('close', () => resolve(stdout));
  });

/**
 * Writes a junit XML artifact for the lint gate so the result shows up as a
 * test case in CI reporting.
 * @param {boolean} failed
 * @param {string} message
 * @returns {void}
 */
const writeJunitXml = (failed, message = '') => {
  if (process.env.OPENSHIFT_CI !== 'true') {
    return;
  }
  const artifactDir = process.env.ARTIFACT_DIR || '/tmp/artifacts';
  const name = 'oxlint-exact-warnings';
  const testCaseName =
    'no oxlint errors are present and the current number of warnings matches MAX_WARNINGS';

  const xml = failed
    ? `<?xml version="1.0" encoding="UTF-8"?><testsuites><testsuite name="${name}" tests="1" failures="1"><testcase classname="${name}" name="${testCaseName}"><failure>${message}</failure></testcase></testsuite></testsuites>`
    : `<?xml version="1.0" encoding="UTF-8"?><testsuites><testsuite name="${name}" tests="1" failures="0"><testcase classname="${name}" name="${testCaseName}"/></testsuite></testsuites>`;

  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, `${name}.junit.xml`), xml);
};

const main = async () => {
  const maxWarnings = getMaxWarnings();
  const output = await runOxlint(process.argv.slice(2));
  let run;
  try {
    run = JSON.parse(output);
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
    writeJunitXml(true, `Found ${errors.length} oxlint error(s).`);
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
    writeJunitXml(true, `Found ${warnings.length} warning(s), exceeding the maximum of ${maxWarnings}.`);
    process.exitCode = 1;
  } else if (warnings.length < maxWarnings) {
    console.error(
      `Found ${warnings.length} warning(s) but the count is ${maxWarnings}. Lower the MAX_WARNINGS value in the lint script in package.json to match the actual warning count.`,
    );
    writeJunitXml(true, `Found ${warnings.length} warning(s) but the ratchet is ${maxWarnings}.`);
    process.exitCode = 1;
  } else {
    writeJunitXml(false);
  }
};

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
