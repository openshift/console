import { execSync } from 'child_process';
import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '../../../../integration-tests/protractor.conf';
import { click } from '../../../console-shared/src/test-utils/utils';
import * as loginView from '../../../../integration-tests/views/login.view';
import * as crudView from '../../../../integration-tests/views/crud.view';
import * as yamlView from '../../../../integration-tests/views/yaml.view';
import { Wizard } from './models/wizard';

describe('Kubevirt nonadmin ui accessibilities', () => {
  const {
    BRIDGE_HTPASSWD_IDP = 'test',
    BRIDGE_HTPASSWD_USERNAME = 'test',
    BRIDGE_HTPASSWD_PASSWORD = 'test',
    KUBEADMIN_IDP = 'kube:admin',
    KUBEADMIN_USERNAME = 'kubeadmin',
    BRIDGE_KUBEADMIN_PASSWORD,
  } = process.env;

  const nonAdminNS = `${testName}-nonadmin`;
  const BROWSER_TIMEOUT = 15000;
  const ACCESS_DENIED_ICON = $('.cos-status-box__access-denied-icon');

  const verifyPermission = async function(ns: string, path: string, perm: string) {
    const wizard = new Wizard();

    // Verify permissions on VM page
    await browser.get(`${appHost}/k8s/ns/${ns}/${path}`);
    if (perm === 'noAccess') {
      await browser.wait(until.presenceOf(crudView.errorMessage));
      await browser.wait(until.presenceOf(ACCESS_DENIED_ICON));
      // TODO: uncomment below when bz1761041 is fixed.
      // expect(crudView.createItemButton.isPresent()).toBe(false);
    }
    if (perm === 'view') {
      await crudView.isLoaded();
      // expect(crudView.createItemButton.isPresent()).toBe(false);
    }
    if (perm === 'edit') {
      await crudView.isLoaded();

      await wizard.openWizard();
      await wizard.close();

      await click(crudView.createItemButton);
      await click(crudView.createYAMLLink);
      await yamlView.isLoaded();
      await click(yamlView.cancelButton);
    }
  };

  const verifyPermissionWithRoleBinding = async function(
    ns: string,
    binding: string,
    role: string,
    perm: string,
  ) {
    execSync(`oc adm policy add-${binding}-to-user ${role} ${BRIDGE_HTPASSWD_USERNAME} -n ${ns}`);
    await verifyPermission(ns, 'virtualmachines', perm);
    await verifyPermission(ns, 'vmtemplates', perm);
    execSync(
      `oc adm policy remove-${binding}-from-user ${role} ${BRIDGE_HTPASSWD_USERNAME} -n ${ns}`,
    );
  };

  beforeAll(async () => {
    await loginView.logout();
    await loginView.login(BRIDGE_HTPASSWD_IDP, BRIDGE_HTPASSWD_USERNAME, BRIDGE_HTPASSWD_PASSWORD);

    // Create its own project
    await browser.get(`${appHost}/k8s/cluster/projects`);
    await crudView.isLoaded();
    const exists = await crudView.rowForName(nonAdminNS).isPresent();
    if (!exists) {
      await crudView.createYAMLButton.click();
      await browser.wait(until.presenceOf($('.modal-body__field')));
      await $$('.modal-body__field')
        .get(0)
        .$('input')
        .sendKeys(nonAdminNS);
      await $('.modal-content')
        .$('#confirm-action')
        .click();
      await browser.wait(until.urlContains(nonAdminNS), BROWSER_TIMEOUT);
    }
  });

  afterAll(async () => {
    await loginView.logout();
    await loginView.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, BRIDGE_KUBEADMIN_PASSWORD);
  });

  it('Nonadmin can use vm dialog in its own namespace', async () => {
    await verifyPermission(nonAdminNS, 'virtualmachines', 'edit');
    await verifyPermission(nonAdminNS, 'vmtemplates', 'edit');
  });

  it('Nonadmin cannot use vm dialog in other namespace', async () => {
    await verifyPermission(testName, 'virtualmachines', 'noAccess');
    await verifyPermission(testName, 'vmtemplates', 'noAccess');
  });

  it('Nonadmin with RoleBinding view can view vm objetcs in the binding NS', async () => {
    await verifyPermissionWithRoleBinding(testName, 'role', 'view', 'view');
  });

  it('Nonadmin with RoleBinding view cannot view vm objetcs in other NS', async () => {
    execSync(`oc adm policy add-role-to-user view ${BRIDGE_HTPASSWD_USERNAME} -n ${nonAdminNS}`);
    await verifyPermission('default', 'virtualmachines', 'noAccess');
    await verifyPermission('default', 'vmtemplates', 'noAccess');
    execSync(
      `oc adm policy remove-role-from-user view ${BRIDGE_HTPASSWD_USERNAME} -n ${nonAdminNS}`,
    );
  });

  it('Nonadmin with RoleBinding edit can edit vm objetcs in the binding NS', async () => {
    await verifyPermissionWithRoleBinding(testName, 'role', 'edit', 'edit');
  });

  it('Nonadmin with RoleBinding edit cannot edit vm objetcs in other NS', async () => {
    execSync(`oc adm policy add-role-to-user edit ${BRIDGE_HTPASSWD_USERNAME} -n ${nonAdminNS}`);
    await verifyPermission('default', 'virtualmachines', 'noAccess');
    await verifyPermission('default', 'vmtemplates', 'noAccess');
    execSync(
      `oc adm policy remove-role-from-user edit ${BRIDGE_HTPASSWD_USERNAME} -n ${nonAdminNS}`,
    );
  });

  it('Nonadmin with ClusterRoleBinding view can view vm objetcs in the cluster', async () => {
    await verifyPermissionWithRoleBinding(testName, 'cluster-role', 'view', 'view');
    await verifyPermissionWithRoleBinding('default', 'cluster-role', 'view', 'view');
  });

  it('Nonadmin with ClusterRoleBinding edit can edit vm objetcs in the cluster', async () => {
    await verifyPermissionWithRoleBinding(testName, 'cluster-role', 'edit', 'edit');
    await verifyPermissionWithRoleBinding('default', 'cluster-role', 'edit', 'edit');
  });
});
