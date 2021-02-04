import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { asyncForEach, deleteResource } from '@console/shared/src/test-utils/utils';
import * as vmView from '../views/virtualMachine.view';
import { exposeServices, getCommonTemplateName } from './utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  NOT_AVAILABLE,
} from './utils/constants/common';
import { VM_STATUS } from './utils/constants/vm';
import { NodePortService } from './types/types';
import { OperatingSystem, Workload } from './utils/constants/wizard';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VMBuilder } from './models/vmBuilder';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';

describe('Kubevirt VM details tab', () => {
  const vmName = `vm-${testName}`;
  const vm = new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.CONTAINER)
    .setName(vmName)
    .setDescription(testName)
    .setStartOnCreation(false)
    .build();
  const serviceCommon = { name: vmName, kind: 'vm', type: 'NodePort', namespace: testName };
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

  beforeAll(async () => {
    await vm.create();
    await vm.waitForStatus(VM_STATUS.Off, VM_ACTIONS_TIMEOUT_SECS);
    exposeServices(nodePortServices);
  });

  afterAll(async () => {
    deleteResource(vm.asResource());
  });

  beforeEach(async () => {
    await vm.navigateToDetail();
  });

  it('ID(CNV-763) Check VM details when VM is off', async () => {
    const templateName = getCommonTemplateName('rhel7');
    const expectation = {
      name: vmName,
      status: VM_STATUS.Off,
      description: NOT_AVAILABLE,
      os: OperatingSystem.RHEL7,
      profile: Workload.SERVER.toLowerCase(),
      template: templateName,
      bootOrder: [`${vmName} (Disk)`],
      flavorConfig: 'Small: 1 CPU | 2 GiB Memory',
      ip: NOT_AVAILABLE,
      pod: NOT_AVAILABLE,
      node: NOT_AVAILABLE,
    };

    const found = {
      name: await resourceTitle.getText(),
      status: await vm.getStatus(),
      description: await vmView.vmDetailDesc(testName, vmName).getText(),
      os: await vmView.vmDetailOS(testName, vmName).getText(),
      profile: await vmView.vmDetailWorkloadProfile(testName, vmName).getText(),
      template: await vmView.vmDetailTemplateByTestID(templateName).getText(),
      bootOrder: await vmView.vmDetailBootOrder(testName, vmName).getText(),
      flavorConfig: await vmView.vmDetailFlavor(testName, vmName).getText(),
      ip: await vmView.vmDetailIP(testName, vmName).getText(),
      pod: await vmView.vmDetailPod(testName, vmName).getText(),
      node: await vmView.vmDetailNode(testName, vmName).getText(),
    };

    const equal = _.isEqual(found, expectation);
    if (!equal) {
      // eslint-disable-next-line no-console
      console.error(`Expected:\n${JSON.stringify(expectation)},\nGot:\n${JSON.stringify(found)}`);
    }
    expect(equal).toBe(true);
  });

  it(
    'ID(CNV-4037) Check VM details when VM is running',
    async () => {
      await vm.start();
      // Empty fields turn into non-empty
      expect(await vmView.vmDetailIP(testName, vmName).getText()).not.toEqual(NOT_AVAILABLE);
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
      ).not.toEqual(NOT_AVAILABLE);
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it('ID(CNV-2081) Check exposed services', async () => {
    await asyncForEach(nodePortServices, async (srv) => {
      expect(await vmView.vmDetailService(srv.exposeName).getText()).toEqual(srv.exposeName);
      expect(await vmView.vmDetailService(srv.exposeName).getAttribute('href')).toContain(
        `/k8s/ns/${testName}/services/${srv.exposeName}`,
      );
    });
  });
});
