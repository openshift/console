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
  BRIDGE_HTPASSWD_IDP = 'test',
  BRIDGE_HTPASSWD_USERNAME = 'test',
  BRIDGE_HTPASSWD_PASSWORD = 'test',
  BRIDGE_KUBEADMIN_PASSWORD,
} = process.env;

describe('Auth test', () => {
  beforeAll(async () => {
    await browser.get(appHost);
    // Stop the perspective detection from running by setting last perspective in localStorage
    await browser.executeScript('window.localStorage.setItem("bridge/last-perspective", "admin")');
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

    it('logs in via htpasswd identity provider', async () => {
      await loginView.login(
        BRIDGE_HTPASSWD_IDP,
        BRIDGE_HTPASSWD_USERNAME,
        BRIDGE_HTPASSWD_PASSWORD,
      );
      expect(browser.getCurrentUrl()).toContain(appHost);
      expect(loginView.userDropdown.getText()).toContain(BRIDGE_HTPASSWD_USERNAME);
    });

    it('does not show admin nav items in Administration to htpasswd user', async () => {
      // Let flags resolve before checking for the presence of nav items.
      await browser.sleep(5000);
      await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Administration')));
      expect(sidenavView.navSectionFor('Administration')).not.toContain('Cluster Status');
      expect(sidenavView.navSectionFor('Administration')).not.toContain('Cluster Settings');
      expect(sidenavView.navSectionFor('Administration')).not.toContain('Namespaces');
      expect(sidenavView.navSectionFor('Administration')).not.toContain(
        'Custom Resource Definitions',
      );
    });

    it('does not show admin nav items in Operators to htpasswd user', async () => {
      await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Operators')));
      expect(sidenavView.navSectionFor('Operators')).not.toContain('OperatorHub');
    });

    it('does not show admin nav items in Storage to htpasswd user', async () => {
      await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Storage')));
      expect(sidenavView.navSectionFor('Storage')).not.toContain('Persistent Volumes');
    });

    it('does not show Compute or Monitoring admin nav items to htpasswd user', async () => {
      expect(sidenavView.navSectionFor('Compute').isPresent()).toBe(false);
      expect(sidenavView.navSectionFor('Monitoring').isPresent()).toBe(false);
    });

    it('logs out htpasswd user', async () => {
      await loginView.logout();
      expect(browser.getCurrentUrl()).toContain('oauth-openshift');
      expect(until.or(loginView.pf3Login, loginView.pf4Login)).toBeTruthy();
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

    it('logs out kubeadmin user', async () => {
      await loginView.logout();
      expect(browser.getCurrentUrl()).toContain('oauth-openshift');
      expect(until.or(loginView.pf3Login, loginView.pf4Login)).toBeTruthy();

      // Log back in so that remaining tests can be run
      await loginView.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, BRIDGE_KUBEADMIN_PASSWORD);
      expect(loginView.userDropdown.getText()).toContain('kube:admin');
    });
  });

  it('is authenticated as cluster admin user', async () => {
    expect(await browser.getCurrentUrl()).toContain(appHost);
    await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Compute')));
    await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Operators')));
    await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Administration')));
    await sidenavView.clickNavLink(['Administration', 'Cluster Settings']);
    await clusterSettingsView.isLoaded();
    expect(clusterSettingsView.heading.isDisplayed()).toBeTruthy();
  });
});
