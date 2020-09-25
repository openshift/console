import { $, browser, ExpectedConditions as until } from 'protractor';

import { appHost } from '../protractor.conf';
import * as loginView from '../views/login.view';

const JASMINE_DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 1000 * 60 * 3;
const KUBEADMIN_IDP = 'kube:admin';
const KUBEADMIN_USERNAME = 'kubeadmin';
const { BRIDGE_KUBEADMIN_PASSWORD } = process.env;

describe('Auth test', () => {
  beforeAll(async () => {
    await browser.get(appHost);
    await browser.sleep(3000); // Wait long enough for the login redirect to complete
  });

  describe('Login test', async () => {
    beforeAll(() => {
      // Extend the default jasmine timeout interval just in case it takes a while for the htpasswd idp to be ready
      jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_EXTENDED_TIMEOUT_INTERVAL;
    });

    afterAll(() => {
      // Set jasmine timeout interval back to the original value after these tests are done
      jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_DEFAULT_TIMEOUT_INTERVAL;
    });

    it('logs in as kubeadmin user', async () => {
      await loginView.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, BRIDGE_KUBEADMIN_PASSWORD);
      expect(browser.getCurrentUrl()).toContain(appHost);
      expect(loginView.userDropdown.getText()).toContain('kube:admin');
      await browser.wait(until.presenceOf($('.co-global-notification')));
      expect($('.co-global-notifications').getText()).toContain(
        'You are logged in as a temporary administrative user. Update the cluster OAuth configuration to allow others to log in.',
      );
    });
  });
});
