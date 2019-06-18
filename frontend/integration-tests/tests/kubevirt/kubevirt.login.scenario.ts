import { browser } from 'protractor';
import { appHost } from '../../protractor.conf';
import { execSync } from 'child_process';
import { KUBEADMIN_IDP, KUBEADMIN_USERNAME, BRIDGE_KUBEADMIN_PASSWORD } from './utils/consts';
import * as loginView from '../../views/login.view';


describe('Authentication', () => {
  beforeAll(async() => {
    await browser.get(appHost);
    await browser.sleep(3000); // Wait long enough for the login redirect to complete
  });

  it('Web console logs in.', async() => {
    await loginView.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, BRIDGE_KUBEADMIN_PASSWORD);
    expect(loginView.userDropdown.getText()).toContain(KUBEADMIN_IDP);
    execSync(`oc login -u ${KUBEADMIN_USERNAME} -p ${BRIDGE_KUBEADMIN_PASSWORD}`);
  });
});
