import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import * as loginView from '@console/internal-integration-tests/views/login.view';
import { withResource, removeLeakedResources } from '@console/shared/src/test-utils/utils';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { isRestrictedAccess } from '../views/vms.list.view';
import { createProject } from './utils/utils';
import { vmConfig, getProvisionConfigs } from './vm.wizard.configs';
import { ProvisionConfigName } from './utils/constants/wizard';
import { VirtualMachine } from './models/virtualMachine';
import { VM_ACTION, VM_STATUS, JASMINE_EXTENDED_TIMEOUT_INTERVAL } from './utils/consts';

const testNonAdminNamespace = `${testName}-non-admin`;
const {
  BRIDGE_HTPASSWD_IDP = 'test',
  BRIDGE_HTPASSWD_USERNAME = 'test',
  BRIDGE_HTPASSWD_PASSWORD = 'test',
} = process.env;

describe('Kubevirt non-admin Flow', () => {
  const leakedResources = new Set<string>();
  const configName = ProvisionConfigName.URL;
  const provisionConfigs = getProvisionConfigs();
  const provisionConfig = provisionConfigs.get(configName);
  provisionConfig.networkResources = [];
  provisionConfig.storageResources = [];

  const vm1Config = vmConfig(configName.toLowerCase(), testNonAdminNamespace, provisionConfig);
  vm1Config.startOnCreation = false;
  const vm = new VirtualMachine(vm1Config);

  beforeAll(async () => {
    await browser.get(appHost);
    await browser.sleep(3000); // Wait long enough for the login redirect to complete
    await loginView.login(BRIDGE_HTPASSWD_IDP, BRIDGE_HTPASSWD_USERNAME, BRIDGE_HTPASSWD_PASSWORD);
    expect(browser.getCurrentUrl()).toContain(appHost);
    expect(loginView.userDropdown.getText()).toContain(BRIDGE_HTPASSWD_USERNAME);
  });

  afterAll(() => {
    removeLeakedResources(leakedResources);
    execSync(`kubectl delete project ${testNonAdminNamespace}`);
  });

  it(
    'non-admin create project and create/remove vm',
    async () => {
      // Navigate to Virtual Machines page
      await browser.get(`${appHost}/k8s/ns/${testNonAdminNamespace}/virtualmachines`);

      // Check to make sure Access is Restricted.
      await browser.wait(until.textToBePresentInElement(isRestrictedAccess, 'Restricted Access'));

      await createProject(testNonAdminNamespace);

      await withResource(
        leakedResources,
        vm.asResource(),
        async () => {
          await vm.create(vm1Config);
          await vm.action(VM_ACTION.Start, false); // Without waiting for the VM to be Running
          await vm.waitForStatus(VM_STATUS.Starting); // Just to make sure it is actually starting,
          await vm.action(VM_ACTION.Delete, false);
          await isLoaded();
        },
        true,
      );
    },
    JASMINE_EXTENDED_TIMEOUT_INTERVAL,
  );

  it('non-admin cannot create vm in foreign namespace', async () => {
    // Navigate to Virtual Machines page with foreign default namespace
    await browser.get(`${appHost}/k8s/ns/default/virtualmachines`);

    // Check to make sure Access is Restricted.
    await browser.wait(until.textToBePresentInElement(isRestrictedAccess, 'Restricted Access'));
  });
});
