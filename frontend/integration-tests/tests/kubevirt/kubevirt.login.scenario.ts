import { browser } from 'protractor';
import { appHost } from '../../protractor.conf';
import { logIn } from '../kubevirt/utils';

describe('Authentication', () => {
  it('Logs in.', async() => {
    await browser.get(appHost);
    await logIn();
  });
});
