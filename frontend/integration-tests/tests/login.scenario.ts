import { $, browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '../protractor.conf';
import * as loginView from '../views/login.view';
import * as sidenavView from '../views/sidenav.view';
import * as clusterSettingsView from '../views/cluster-settings.view';

const JASMINE_DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 1000 * 60 * 3;
const KUBEADMIN_IDP = 'kube:admin';
const KUBEADMIN_USERNAME = 'kubeadmin';
const {
  HTPASSWD_IDP = 'test',
  HTPASSWD_USERNAME = 'test',
  HTPASSWD_PASSWORD = 'test',
  KUBEADMIN_PASSWORD,
} = process.env;

describe('Auth test', () => {
  beforeAll(async() => {
    await browser.get(appHost);
    await browser.sleep(3000); // Wait long enough for the login redirect to complete
  });

  if (KUBEADMIN_PASSWORD) {
    describe('Login test', async() => {
      beforeAll(() => {
        // Extend the default jasmine timeout interval just in case it takes a while for the htpasswd idp to be ready
        jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_EXTENDED_TIMEOUT_INTERVAL;
      });

      afterAll(() => {
        // Set jasmine timeout interval back to the original value after these tests are done
        jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_DEFAULT_TIMEOUT_INTERVAL;
      });

      it('logs in via htpasswd identity provider', async() => {
        await loginView.login(HTPASSWD_IDP, HTPASSWD_USERNAME, HTPASSWD_PASSWORD);
        expect(browser.getCurrentUrl()).toContain(appHost);
        expect(loginView.userDropdown.getText()).toContain(HTPASSWD_USERNAME);
      });

      it('logs out htpasswd user', async() => {
        await loginView.logout();
        expect(browser.getCurrentUrl()).toContain('openshift-authentication');
        expect($('.login-pf').isPresent()).toBeTruthy();
      });

      it('logs in as kubeadmin user', async() => {
        await loginView.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, KUBEADMIN_PASSWORD);
        expect(browser.getCurrentUrl()).toContain(appHost);
        expect(loginView.userDropdown.getText()).toContain('kube:admin');
        await browser.wait(until.presenceOf($('.co-global-notification')));
        expect($('.co-global-notifications').getText()).toContain('You are logged in as a temporary administrative user. Update the cluster OAuth configuration to allow others to log in.');
      });

      it('logs out kubeadmin user', async() => {
        await loginView.logout();
        expect(browser.getCurrentUrl()).toContain('openshift-authentication');
        expect($('.login-pf').isPresent()).toBeTruthy();

        // Log back in so that remaining tests can be run
        await loginView.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, KUBEADMIN_PASSWORD);
        expect(loginView.userDropdown.getText()).toContain('kube:admin');
      });
    });
  }
  it('is authenticated as cluster admin user', async() => {
    expect(await browser.getCurrentUrl()).toContain(appHost);
    await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Administration')));
    await sidenavView.clickNavLink(['Administration', 'Cluster Settings']);
    await clusterSettingsView.isLoaded();
    expect(clusterSettingsView.heading.isDisplayed()).toBeTruthy();
  });
});
