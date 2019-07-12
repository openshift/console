import { browser } from 'protractor';

import { appHost } from '../protractor.conf';
import * as loginView from '../views/login.view';

const KUBEADMIN_IDP = 'kube:admin';
const KUBEADMIN_USERNAME = 'kubeadmin';
const {
  BRIDGE_KUBEADMIN_PASSWORD,
} = process.env;

describe('Authentication', () => {
  beforeAll(async() => {
    await browser.get(appHost);
    await browser.sleep(3000); // Wait long enough for the login redirect to complete
  });

  it('logs in as kubeadmin user', async() => {
    await loginView.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, BRIDGE_KUBEADMIN_PASSWORD);
    expect(loginView.userDropdown.getText()).toContain('kube:admin');
  });
});
