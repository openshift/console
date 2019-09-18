import * as _ from 'lodash';
import { testName } from '../../../../integration-tests/protractor.conf';
import { isLoaded, resourceTitle } from '../../../../integration-tests/views/crud.view';
import * as vmView from '../views/virtualMachine.view';
import {
  asyncForEach,
  createResource,
  deleteResource,
} from '../../../console-shared/src/test-utils/utils';
import { getVmManifest, basicVmConfig } from './utils/mocks';
import { exposeServices } from './utils/utils';
import { VirtualMachine } from './models/virtualMachine';
import { TABS, DASH, VM_BOOTUP_TIMEOUT_SECS } from './utils/consts';
import { NodePortService } from './utils/types';

describe('Test VM overview', () => {
  const vmName = `vm-${testName}`;
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}`;
  const serviceCommon = { name: vmName, kind: 'vm', type: 'NodePort', namespace: testName };
  const testVM = getVmManifest('Container', testName, vmName, cloudInit);
  const vm = new VirtualMachine(testVM.metadata);
  const nodePortServices = new Set<NodePortService>();
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmName}-service-ssh`,
    port: '22',
    targetPort: '20022',
  });
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmName}-service-smtp`,
    port: '25',
    targetPort: '20025',
  });
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmName}-service-http`,
    port: '80',
    targetPort: '20080',
  });

  beforeAll(() => {
    createResource(testVM);
    exposeServices(nodePortServices);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  beforeEach(async () => {
    await vm.navigateToTab(TABS.OVERVIEW);
    await isLoaded();
  });

  it('Check VM details in overview when VM is off', async () => {
    const expectation = {
      name: vmName,
      description: testName,
      os: basicVmConfig.operatingSystem,
      profile: basicVmConfig.workloadProfile,
      template: 'rhel7-desktop-tiny',
      bootOrder: ['rootdisk', 'nic0', 'cloudinitdisk'],
      flavor: basicVmConfig.flavor,
      ip: DASH,
      pod: DASH,
      node: DASH,
      offIconPresent: true,
    };

    const found = {
      name: await resourceTitle.getText(),
      description: await vmView.vmDetailDesc(testName, vmName).getText(),
      os: await vmView.vmDetailOS(testName, vmName).getText(),
      profile: await vmView.vmDetailWorkloadProfile(testName, vmName).getText(),
      template: await vmView.vmDetailTemplate(testName, vmName).getText(),
      bootOrder: await vmView.vmDetailBootOrder(testName, vmName).getText(),
      flavor: await vmView.vmDetailFlavor(testName, vmName).getText(),
      ip: await vmView.vmDetailIP(testName, vmName).getText(),
      pod: await vmView.vmDetailPod(testName, vmName).getText(),
      node: await vmView.vmDetailNode(testName, vmName).getText(),
      offIconPresent: await vmView.statusIcon(vmView.statusIcons.off).isPresent(),
    };

    const equal = _.isEqual(found, expectation);
    if (!equal) {
      // eslint-disable-next-line no-console
      console.error(`Expected:\n${JSON.stringify(expectation)},\nGot:\n${JSON.stringify(found)}`);
    }
    expect(equal).toBe(true);
  });

  it(
    'Check VM details in overview when VM is running',
    async () => {
      await vm.action('Start');
      // Empty fields turn into non-empty
      expect(await vmView.vmDetailIP(testName, vmName).getText()).not.toEqual(DASH);
      expect(
        await vmView
          .vmDetailPod(testName, vmName)
          .$('a')
          .getText(),
      ).toContain('virt-launcher');
      expect(
        await vmView
          .vmDetailNode(testName, vmName)
          .$('a')
          .getText(),
      ).not.toEqual(DASH);
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it('Check vm services', async () => {
    await vm.navigateToTab(TABS.OVERVIEW);
    await asyncForEach(nodePortServices, async (srv) => {
      expect(await vmView.vmDetailService(srv.exposeName).getText()).toEqual(srv.exposeName);
      expect(await vmView.vmDetailService(srv.exposeName).getAttribute('href')).toContain(
        `/k8s/ns/${testName}/services/${srv.exposeName}`,
      );
    });
  });
});
