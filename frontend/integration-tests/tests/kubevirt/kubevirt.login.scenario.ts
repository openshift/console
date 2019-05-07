import { browser } from 'protractor';
import { appHost } from '../../protractor.conf';
import { logIn } from './utils/utils';

describe('Authentication', () => {
  it('Logs in.', async() => {
    await browser.get(appHost);
    if (process.env.BRIDGE_BASE_ADDRESS !== undefined) {
      await logIn();
    }
  });
});
