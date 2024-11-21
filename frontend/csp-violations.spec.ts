import { chromium, Browser, Page } from 'playwright';

describe('Content Security Policy (CSP) Violations', () => {
  jest.setTimeout(30000); // Timeout for the entire test suite

  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    // Launch a new browser
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    // Close the browser
    await browser.close();
  });

  test('should not have CSP violations', async () => {
    const logs: string[] = [];

    // Listen for console log messages
    page.on('console', (msg) => {
      const msgText = msg.text();
      if (msg.type() === 'warning' && msgText.includes('Content Security Policy')) {
        logs.push(msgText);
        // eslint-disable-next-line no-console
        console.warn('CSP Violation Count:', logs.length, 'Messages:', logs);
      }
    });

    // Visit the console root page
    await page.goto(`${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}`);

    // Wait for some time to capture logs
    await page.waitForTimeout(10000);

    // Check if there are any CSP violations
    expect(logs.length).toBe(0);
  });
});
