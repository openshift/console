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
import { Browser, Page, launch } from 'puppeteer-core';

// Use 'Chrome for Testing' build of the Chrome web browser.
// https://googlechromelabs.github.io/chrome-for-testing/
const testBrowser = BrowserType.CHROME;
const testBrowserTag = 'stable';

// The 'NO_SANDBOX' env. variable can be used to run Chrome under the root user.
// https://chromium.googlesource.com/chromium/src/+/HEAD/docs/design/sandbox.md
const noSandbox = process.env.NO_SANDBOX === 'true';

const baseDir = path.resolve(__dirname, '.puppeteer');
const cacheDir = path.resolve(baseDir, 'cache');
const userDataDir = path.resolve(baseDir, 'user-data');

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
    args: noSandbox ? ['--no-sandbox'] : [],
  });
};

const testPage = async (
  browser: Browser,
  pageURL: string,
  cspReportURL: string,
  pageLoadCallback: (page: Page) => Promise<void>,
  errorCallback: VoidFunction,
) => {
  const page = await browser.newPage();

  // Create a Chrome DevTools Protocol session for the page.
  const cdpSession = await page.createCDPSession();

  // This will trigger Fetch.requestPaused events for the matching requests.
  await cdpSession.send('Fetch.enable', {
    patterns: [{ resourceType: 'Document' }, { resourceType: 'CSPViolationReport' }],
  });

  // Handle network requests that get paused through Fetch.enable command.
  cdpSession.on('Fetch.requestPaused', ({ resourceType, request, requestId }) => {
    if (resourceType === 'Document' && request.url === pageURL) {
      const headers = Object.entries(request.headers).map(([name, value]) => ({ name, value }));

      headers.push({ name: 'Test-CSP-Reporting-Endpoint', value: cspReportURL });
      cdpSession.send('Fetch.continueRequest', { requestId, headers });
    }

    if (resourceType === 'CSPViolationReport' && request.url === cspReportURL) {
      console.error('CSP violation detected', request.postData);
      errorCallback();

      cdpSession.send('Fetch.fulfillRequest', { requestId, responseCode: 200 });
    }
  });

  console.info(`Loading page ${pageURL}`);

  const httpResponse = await page.goto(pageURL);

  if (httpResponse.ok()) {
    try {
      await pageLoadCallback(page);
    } catch (e) {
      console.error(e);
      errorCallback();
    }
  } else {
    console.error(`Non-OK response: status ${httpResponse.status()} ${httpResponse.statusText()}`);
    errorCallback();
  }

  await cdpSession.detach();
  await page.close();
};

const waitForNetworkIdle = async (page: Page) => {
  await page.waitForNetworkIdle({ idleTime: 2000 });
};

(async () => {
  let errorsDetected = false;

  const cspReportURL = 'http://localhost:7777/';
  const browser = await initBrowserInstance();

  const errorCallback = () => {
    errorsDetected = true;
  };

  await testPage(
    browser,
    'http://localhost:9000/dashboards',
    cspReportURL,
    waitForNetworkIdle,
    errorCallback,
  );

  await browser.close();

  if (errorsDetected) {
    process.exit(1);
  } else {
    console.info('No errors detected');
    process.exit(0);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
