import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { asyncForEach } from '@console/shared/src/test-utils/utils';
import * as vmView from '../views/virtualMachine.view';
import { basicVMConfig } from './utils/mocks';
import { TAB, VM_BOOTUP_TIMEOUT_SECS, VM_ACTION, VM_STATUS, NOT_AVAILABLE } from './utils/consts';
import { nodePortServices, vm } from './vm.setup.scenario';

describe('Test VM overview', () => {
  it('ID(CNV-763) Check VM details in overview when VM is off', async () => {
    await vm.navigateToTab(TAB.Details);

    const expectation = {
      name: vm.name,
      status: VM_STATUS.Off,
      description: testName,
      os: basicVMConfig.operatingSystem,
      profile: basicVMConfig.workloadProfile,
      template: NOT_AVAILABLE,
      bootOrder: ['rootdisk (Disk)', 'nic-0 (NIC)', 'cloudinitdisk (Disk)'],
      flavorConfig: 'Tiny: 1 vCPU, 1 GiB Memory',
      ip: NOT_AVAILABLE,
      pod: NOT_AVAILABLE,
      node: NOT_AVAILABLE,
    };

    const found = {
      name: await resourceTitle.getText(),
      status: await vm.getStatus(),
      description: await vmView.vmDetailDesc(testName, vm.name).getText(),
      os: await vmView.vmDetailOS(testName, vm.name).getText(),
      profile: await vmView.vmDetailWorkloadProfile(testName, vm.name).getText(),
      template: await vmView.vmDetailTemplate(testName, vm.name).getText(),
      bootOrder: await vmView.vmDetailBootOrder(testName, vm.name).getText(),
      flavorConfig: await vmView.vmDetailFlavor(testName, vm.name).getText(),
      ip: await vmView.vmDetailIP(testName, vm.name).getText(),
      pod: await vmView.vmDetailPod(testName, vm.name).getText(),
      node: await vmView.vmDetailNode(testName, vm.name).getText(),
    };

    const equal = _.isEqual(found, expectation);
    if (!equal) {
      // eslint-disable-next-line no-console
      console.error(`Expected:\n${JSON.stringify(expectation)},\nGot:\n${JSON.stringify(found)}`);
    }
    expect(equal).toBe(true);
  });

  it(
    'ID(CNV-4037) Check VM details in overview when VM is running',
    async () => {
      await vm.action(VM_ACTION.Start);
      // Empty fields turn into non-empty
      expect(await vmView.vmDetailIP(testName, vm.name).getText()).not.toEqual(NOT_AVAILABLE);
      expect(
        await vmView
          .vmDetailPod(testName, vm.name)
          .$('a')
          .getText(),
      ).toContain('virt-launcher');
      expect(
        await vmView
          .vmDetailNode(testName, vm.name)
          .$('a')
          .getText(),
      ).not.toEqual(NOT_AVAILABLE);
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it('ID(CNV-2081) Check exposed vm services', async () => {
    await asyncForEach(nodePortServices, async (srv) => {
      expect(await vmView.vmDetailService(srv.exposeName).getText()).toEqual(srv.exposeName);
      expect(await vmView.vmDetailService(srv.exposeName).getAttribute('href')).toContain(
        `/k8s/ns/${testName}/services/${srv.exposeName}`,
      );
    });
  });
});
