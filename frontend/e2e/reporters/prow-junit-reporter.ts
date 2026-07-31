import * as fs from 'fs';
import * as path from 'path';

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

interface ProwJUnitReporterOptions {
  outputFile?: string;
  configDir?: string;
}

interface XMLEntry {
  name: string;
  attributes?: Record<string, string | number>;
  children?: XMLEntry[];
  text?: string;
}

const discouragedXMLCharacters = new RegExp(
  '[\u0000-\u0008\u000b-\u000c\u000e-\u001f\u007f-\u0084\u0086-\u009f]',
  'g',
);
// eslint-disable-next-line no-control-regex
const ansiRegex = /\[[0-9;]*m/g;

function stripAnsi(text: string): string {
  return text.replace(ansiRegex, '');
}

function escapeXML(text: string, isCDATA: boolean): string {
  if (isCDATA) {
    text = `<![CDATA[${text.replace(/]]>/g, ']]&gt;')}]]>`;
  } else {
    text = text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  return text.replace(discouragedXMLCharacters, '');
}

function serializeXML(entry: XMLEntry, tokens: string[]): void {
  const attrs: string[] = [];
  for (const [name, value] of Object.entries(entry.attributes || {})) {
    attrs.push(`${name}="${escapeXML(String(value), false)}"`);
  }
  tokens.push(`<${entry.name}${attrs.length ? ' ' : ''}${attrs.join(' ')}>`);
  for (const child of entry.children || []) {
    serializeXML(child, tokens);
  }
  if (entry.text) {
    tokens.push(escapeXML(entry.text, true));
  }
  tokens.push(`</${entry.name}>`);
}

function classifyError(result: TestResult): {
  elementName: string;
  type: string;
  message: string;
} | null {
  const error = result.error;
  if (!error) return null;

  const rawMessage = stripAnsi(error.message || (error as { value?: string }).value || '');
  const nameMatch = rawMessage.match(/^(\w+): /);
  const errorName = nameMatch ? nameMatch[1] : '';
  const messageBody = nameMatch ? rawMessage.slice(nameMatch[0].length) : rawMessage;
  const firstLine = messageBody.split('\n')[0].trim();

  const matcherMatch = rawMessage.match(/expect\(.*?\)\.(not\.)?(\w+)/);
  if (matcherMatch) {
    return {
      elementName: 'failure',
      type: `expect.${matcherMatch[1] || ''}${matcherMatch[2]}`,
      message: firstLine,
    };
  }

  return {
    elementName: 'error',
    type: errorName || 'Error',
    message: firstLine,
  };
}

function getTestName(test: TestCase): string {
  return test.titlePath().slice(3).join(' › ');
}

function deriveStepName(): string | null {
  const jobName = process.env.JOB_NAME;
  const repoOwner = process.env.REPO_OWNER;
  const repoName = process.env.REPO_NAME;
  const branch = process.env.PULL_BASE_REF;

  if (!jobName || !repoOwner || !repoName || !branch) return null;

  const prefixes = [`pull-ci-`, `periodic-ci-`, `branch-ci-`];
  for (const prefix of prefixes) {
    const full = `${prefix}${repoOwner}-${repoName}-${branch}-`;
    if (jobName.startsWith(full)) {
      return jobName.slice(full.length);
    }
  }
  return null;
}

function buildHTMLReportURL(): string | null {
  const buildId = process.env.BUILD_ID;
  const jobName = process.env.JOB_NAME;
  const pullNumber = process.env.PULL_NUMBER;
  const repoOwner = process.env.REPO_OWNER;
  const repoName = process.env.REPO_NAME;

  if (!buildId || !jobName) return null;

  const baseURL = 'https://gcsweb-ci.apps.ci.l2s4.p1.openshiftapps.com/gcs/test-platform-results';
  let jobPath: string;

  if (pullNumber && repoOwner && repoName) {
    jobPath = `${baseURL}/pr-logs/pull/${repoOwner}_${repoName}/${pullNumber}/${jobName}/${buildId}`;
  } else {
    jobPath = `${baseURL}/logs/${jobName}/${buildId}`;
  }

  const stepName = deriveStepName();
  if (stepName) {
    return `${jobPath}/artifacts/${stepName}/test/artifacts/playwright-report/index.html`;
  }
  return `${jobPath}/artifacts/`;
}

/**
 * Custom Playwright reporter that generates Prow-compatible JUnit XML.
 *
 * Prow's Spyglass JUnit lens detects flaky tests by finding duplicate
 * <testcase> entries with the same name -- one with <failure> and one
 * without. Playwright's built-in JUnit reporter uses <flakyFailure>
 * elements which Prow silently ignores. This reporter bridges the gap.
 */
class ProwJUnitReporter implements Reporter {
  private suite!: Suite;
  private timestamp!: Date;
  private outputFile: string;
  private configDir: string;

  constructor(options: ProwJUnitReporterOptions = {}) {
    this.configDir = options.configDir || process.cwd();
    this.outputFile =
      options.outputFile || path.resolve(this.configDir, 'test-results', 'prow-junit-results.xml');
  }

  printsToStdio(): boolean {
    return true;
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.suite = suite;
    this.timestamp = new Date();
  }

  async onEnd(result: FullResult): Promise<void> {
    const suiteEntries: XMLEntry[] = [];
    let totalTests = 0;
    let totalFailures = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    const flakyTests: { name: string; file: string }[] = [];
    const failedTests: { name: string; file: string }[] = [];

    for (const projectSuite of this.suite.suites) {
      for (const fileSuite of projectSuite.suites) {
        const { entry, tests, failures, errors, skipped, flaky, failed } =
          this._buildTestSuite(projectSuite.title, fileSuite);
        suiteEntries.push(entry);
        totalTests += tests;
        totalFailures += failures;
        totalErrors += errors;
        totalSkipped += skipped;
        flakyTests.push(...flaky);
        failedTests.push(...failed);
      }
    }

    const root: XMLEntry = {
      name: 'testsuites',
      attributes: {
        id: process.env.PLAYWRIGHT_JUNIT_SUITE_ID || '',
        name: process.env.PLAYWRIGHT_JUNIT_SUITE_NAME || '',
        tests: totalTests,
        failures: totalFailures,
        skipped: totalSkipped,
        errors: totalErrors,
        time: (result.duration / 1000).toFixed(3),
      },
      children: suiteEntries,
    };

    const tokens: string[] = [];
    serializeXML(root, tokens);
    const xmlContent = tokens.join('\n');

    await fs.promises.mkdir(path.dirname(this.outputFile), { recursive: true });
    await fs.promises.writeFile(this.outputFile, xmlContent);

    const reportURL = buildHTMLReportURL();
    if (reportURL) {
      const linkFile = path.resolve(
        path.dirname(this.outputFile),
        'custom-link-playwright-report.html',
      );
      const html = [
        '<html>',
        '<head><title>Playwright Report</title><link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"></head>',
        '<body style="font-family: Helvetica, Arial, sans-serif; margin: 0;">',
        `<div style="font-size: 14px; padding: 8px 24px;"><a target="_blank" href="${reportURL}" style="color: #ff9999">Playwright HTML Report<i class="material-icons" style="font-size: 14px; vertical-align: middle; padding-left: 3px;">open_in_new</i></a></div>`,
        '</body>',
        '</html>',
      ].join('\n');
      await fs.promises.writeFile(linkFile, html);
    }

    this._printSummary(totalTests, failedTests.length, totalSkipped, flakyTests, failedTests, result);
  }

  private _buildTestSuite(
    projectName: string,
    fileSuite: Suite,
  ): {
    entry: XMLEntry;
    tests: number;
    failures: number;
    errors: number;
    skipped: number;
    flaky: { name: string; file: string }[];
    failed: { name: string; file: string }[];
  } {
    let tests = 0;
    let skipped = 0;
    let failures = 0;
    let errors = 0;
    let duration = 0;
    const children: XMLEntry[] = [];
    const flaky: { name: string; file: string }[] = [];
    const failed: { name: string; file: string }[] = [];

    for (const test of fileSuite.allTests()) {
      tests++;
      for (const r of test.results) duration += r.duration;

      const outcome = test.outcome();
      const testName = getTestName(test);

      if (outcome === 'skipped') {
        skipped++;
        children.push(this._buildSkippedEntry(testName, fileSuite.title, test));
      } else if (outcome === 'flaky') {
        // Emit TWO entries: failed attempt first, then passed attempt
        // Prow detects flaky when it sees both failed + passed with the same name
        const failedResult = test.results.find(
          (r) => r.status === 'failed' || r.status === 'timedOut',
        );
        const passedResult = test.results.find((r) => r.status === 'passed');

        if (failedResult) {
          children.push(this._buildFailedEntry(testName, fileSuite.title, failedResult));
          failures++;
        }
        if (passedResult) {
          children.push(this._buildPassedEntry(testName, fileSuite.title, passedResult));
        }

        flaky.push({ name: testName, file: fileSuite.title });
      } else if (outcome === 'unexpected') {
        const lastResult = test.results[test.results.length - 1];
        const errorInfo = classifyError(lastResult);
        if (errorInfo?.elementName === 'error') {
          errors++;
        } else {
          failures++;
        }
        children.push(this._buildFailedEntry(testName, fileSuite.title, lastResult));
        failed.push({ name: testName, file: fileSuite.title });
      } else {
        // expected (passed)
        const lastResult = test.results[test.results.length - 1];
        children.push(this._buildPassedEntry(testName, fileSuite.title, lastResult));
      }
    }

    const entry: XMLEntry = {
      name: 'testsuite',
      attributes: {
        name: fileSuite.title,
        timestamp: this.timestamp.toISOString(),
        hostname: projectName,
        tests,
        failures,
        skipped,
        time: (duration / 1000).toFixed(3),
        errors,
      },
      children,
    };

    return { entry, tests, failures, errors, skipped, flaky, failed };
  }

  private _buildPassedEntry(testName: string, className: string, result: TestResult): XMLEntry {
    return {
      name: 'testcase',
      attributes: {
        name: testName,
        classname: className,
        time: (result.duration / 1000).toFixed(3),
      },
      children: [],
    };
  }

  private _buildFailedEntry(testName: string, className: string, result: TestResult): XMLEntry {
    const errorInfo = classifyError(result);
    const stack =
      stripAnsi(
        result.error?.stack ||
          result.error?.message ||
          (result.error as { value?: string })?.value ||
          '',
      ) || 'No error details available';

    const children: XMLEntry[] = [];
    children.push({
      name: errorInfo?.elementName || 'failure',
      attributes: {
        message: errorInfo?.message || 'Test failed',
        type: errorInfo?.type || 'FAILURE',
      },
      text: stack,
    });

    return {
      name: 'testcase',
      attributes: {
        name: testName,
        classname: className,
        time: (result.duration / 1000).toFixed(3),
      },
      children,
    };
  }

  private _buildSkippedEntry(testName: string, className: string, test: TestCase): XMLEntry {
    const children: XMLEntry[] = [{ name: 'skipped' }];

    const skipAnnotation = test.annotations.find((a) => a.type === 'skip' || a.type === 'fixme');
    if (skipAnnotation?.description) {
      children.push({
        name: 'properties',
        children: [
          {
            name: 'property',
            attributes: { name: 'skip', value: skipAnnotation.description },
          },
        ],
      });
    }

    return {
      name: 'testcase',
      attributes: { name: testName, classname: className },
      children,
    };
  }

  private _printSummary(
    total: number,
    failed: number,
    skipped: number,
    flakyTests: { name: string; file: string }[],
    failedTests: { name: string; file: string }[],
    result: FullResult,
  ): void {
    const passed = total - failed - skipped - flakyTests.length;
    const durationSec = (result.duration / 1000).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('Playwright Test Summary (Prow Reporter)');
    console.log('='.repeat(70));
    console.log(
      `Total: ${total} | Passed: ${passed} | Failed: ${failed} | Flaky: ${flakyTests.length} | Skipped: ${skipped} | Duration: ${durationSec}s`,
    );

    if (flakyTests.length > 0) {
      console.log(`\nFlaky tests (passed on retry):`);
      for (const t of flakyTests) {
        console.log(`  - ${t.name} (${t.file})`);
      }
    }

    if (failedTests.length > 0) {
      console.log(`\nFailed tests:`);
      for (const t of failedTests) {
        console.log(`  - ${t.name} (${t.file})`);
      }
    }

    const reportURL = buildHTMLReportURL();
    if (reportURL) {
      console.log(`\nPlaywright HTML Report:`);
      console.log(`  ${reportURL}`);
    }

    console.log('='.repeat(70) + '\n');
  }
}

export default ProwJUnitReporter;
