/* eslint-env node */
/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import {
  Browser as BrowserType,
  detectBrowserPlatform,
  getInstalledBrowsers,
  install,
  resolveBuildId,
} from '@puppeteer/browsers';
import { Browser, HTTPResponse, launch } from 'puppeteer-core';

// Use 'Chrome for Testing' build of the Chrome web browser.
// https://googlechromelabs.github.io/chrome-for-testing/
const testBrowser = BrowserType.CHROME;
const testBrowserTag = 'stable';

const baseDir = path.resolve(__dirname, '.puppeteer');
const cacheDir = path.resolve(baseDir, 'cache');
const userDataDir = path.resolve(baseDir, 'user-data');

const parseNumValue = (value: string, defaultValue: number) => {
  if (!value) {
    return defaultValue;
  }

  const num = Number(value);
  return !isNaN(num) && isFinite(num) ? num : defaultValue;
};

const envParameters = {
  // The 'NO_SANDBOX' env. variable can be used to run Chrome under the root user.
  // https://chromium.googlesource.com/chromium/src/+/HEAD/docs/design/sandbox.md
  noSandbox: process.env.NO_SANDBOX === 'true',

  // Base URL of Console web application.
  consoleBaseURL: process.env.CONSOLE_BASE_URL || 'http://localhost:9000',

  // CSP reporting endpoint to be used for testing Console pages.
  cspReportURL: process.env.CSP_REPORT_URL || 'http://localhost:7777',

  // Timeout [ms] when loading Console pages. Default value 60s should give
  // the browser enough time to load all Console resources over the network.
  pageLoadTimeout: parseNumValue(process.env.PAGE_LOAD_TIMEOUT, 60000),

  // Timeout [ms] used for "no network activity" check after loading a page.
  pageNetIdleTimeout: parseNumValue(process.env.PAGE_NET_IDLE_TIMEOUT, 20000),
};

const findInstalledBrowser = async () => {
  const allBrowsers = await getInstalledBrowsers({ cacheDir });
  return allBrowsers.find((b) => b.browser === testBrowser);
};

const initBrowserInstance = async () => {
  let browser = await findInstalledBrowser();

  if (!browser) {
    console.info(`Browser ${testBrowser} not found, installing...`);

    browser = await install({
      browser: testBrowser,
      buildId: await resolveBuildId(testBrowser, detectBrowserPlatform(), testBrowserTag),
      cacheDir,
    });
  }

  console.info(
    `Using browser ${browser.browser} on ${browser.platform} with build ID ${browser.buildId}`,
  );

  fs.rmSync(userDataDir, { recursive: true, force: true });

  return launch({
    headless: true,
    browser: testBrowser,
    executablePath: browser.executablePath,
    userDataDir,
    args: envParameters.noSandbox ? ['--no-sandbox'] : [],
  });
};

/**
 * Use `browser` to test `pageURL` for Content Security Policy (CSP) violations.
 */
const testPage = async (
  browser: Browser,
  pageURL: URL,
  cspReportURL: URL,
  errorCallback: VoidFunction,
) => {
  const page = await browser.newPage();

  // Create a Chrome DevTools Protocol (CDP) session for the page.
  const cdpSession = await page.createCDPSession();

  // This will trigger 'Fetch.requestPaused' events for the matching requests.
  await cdpSession.send('Fetch.enable', {
    patterns: [{ resourceType: 'Document' }, { resourceType: 'CSPViolationReport' }],
  });

  // Handle network requests that get paused through 'Fetch.enable' command.
  cdpSession.on('Fetch.requestPaused', ({ resourceType, request, requestId }) => {
    // When requesting the web page, add custom 'Test-CSP-Reporting-Endpoint' HTTP header
    // in order to instruct Console Bridge server to use the given CSP reporting endpoint.
    if (resourceType === 'Document' && request.url === pageURL.href) {
      const headers = Object.entries(request.headers).map(([name, value]) => ({ name, value }));

      headers.push({ name: 'Test-CSP-Reporting-Endpoint', value: cspReportURL.href });
      cdpSession.send('Fetch.continueRequest', { requestId, headers });
    }

    // The browser will attempt to send any CSP violations to the CSP reporting endpoint.
    // When such request occurs, we manually fulfill that request before it is sent over
    // the network and therefore avoiding the need to implement that reporting endpoint.
    else if (resourceType === 'CSPViolationReport' && request.url === cspReportURL.href) {
      try {
        console.error('CSP violation detected:', JSON.parse(request.postData));
      } catch (e) {
        console.error('CSP violation detected, but request POST data failed to parse as JSON');
      }

      errorCallback();
      cdpSession.send('Fetch.fulfillRequest', { requestId, responseCode: 200 });
    }

    // Resume other requests that were not explicitly handled above.
    else {
      cdpSession.send('Fetch.continueRequest', { requestId });
    }
  });

  console.info(`Loading page ${pageURL}`);

  let response: HTTPResponse;

  try {
    console.time('page-load');
    response = await page.goto(pageURL.href, { timeout: envParameters.pageLoadTimeout });
  } catch (e) {
    console.warn('Page was not fully loaded within the timeout');
  } finally {
    console.timeEnd('page-load');
  }

  if (response && response.ok()) {
    try {
      console.time('page-net-idle');
      await page.waitForNetworkIdle({ idleTime: 2000, timeout: envParameters.pageNetIdleTimeout });
    } catch (e) {
      console.warn('Page could not reach idle network state within the timeout');
    } finally {
      console.timeEnd('page-net-idle');
    }
  } else if (response && !response.ok()) {
    console.error(`Non-OK response: status ${response.status()} ${response.statusText()}`);
    errorCallback();
  }

  await cdpSession.detach();
  await page.close();
};

(async () => {
  try {
    let errorsDetected = false;

    console.info('Using env. parameters:', envParameters);

    const browser = await initBrowserInstance();

    const errorCallback = () => {
      errorsDetected = true;
    };

    await testPage(
      browser,
      new URL('/dashboards', envParameters.consoleBaseURL),
      new URL(envParameters.cspReportURL),
      errorCallback,
    );

    await browser.close();

    if (errorsDetected) {
      process.exit(1);
    } else {
      console.info('No errors detected');
      process.exit(0);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
