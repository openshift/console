const puppeteerInstance = require('puppeteer');

describe('Content Security Policy (CSP) Violations', () => {
  jest.setTimeout(60000); // Timeout for the entire test suite

  test('should not have CSP violations', async () => {
    // Launch a new browser
    const browser = await puppeteerInstance.launch({ headless: true });
    const page = await browser.newPage();
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

    // visit the console root page
    await page.goto(`${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}`);

    // Wait for some time to capture logs
    await page.waitForTimeout(10000);

    // check if there are any CSP violations
    expect(logs.length).toBe(0);

    // Close the browser
    await browser.close();
  });
});
