import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded, resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { asyncForEach, createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import * as vmView from '../views/virtualMachine.view';
import { getVMIManifest } from './mocks/mocks';
import { exposeServices } from './utils/utils';
import { VirtualMachineInstance } from './models/virtualMachineInstance';
import { NOT_AVAILABLE } from './utils/constants/common';
import { NodePortService } from './types/types';
import { vmiDetailFlavor } from '../views/virtualMachineInstance.view';
import { VM_STATUS, TAB } from './utils/constants/vm';
import { OperatingSystem, Workload } from './utils/constants/wizard';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

describe('Test VMI Details', () => {
  const vmiName = `vmi-${testName}`;
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}`;
  const serviceCommon = { name: vmiName, kind: 'vmi', type: 'NodePort', namespace: testName };
  const testVMI = getVMIManifest(ProvisionSource.CONTAINER, testName, vmiName, cloudInit);
  const vmi = new VirtualMachineInstance(testVMI.metadata);
  const nodePortServices = new Set<NodePortService>();
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmiName}-service-ssh`,
    port: '22',
    targetPort: '20022',
  });
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmiName}-service-smtp`,
    port: '25',
    targetPort: '20025',
  });
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmiName}-service-http`,
    port: '80',
    targetPort: '20080',
  });

  beforeAll(async () => {
    createResource(testVMI);
    await vmi.waitForStatus(VM_STATUS.Running);

    exposeServices(nodePortServices);
  });

  afterAll(() => {
    deleteResource(testVMI);
  });

  beforeEach(async () => {
    await vmi.navigateToTab(TAB.Details);
    await isLoaded();
  });

  it('ID(CNV-3703) Check VMI data in Details', async () => {
    const expectation = {
      name: vmiName,
      status: VM_STATUS.Running,
      description: testName,
      os: OperatingSystem.RHEL7,
      profile: Workload.DESKTOP,
      bootOrderTexts: ['rootdisk (Disk)', 'nic-0 (NIC)', 'cloudinitdisk (Disk)'],
      flavorText: 'Tiny: 1 vCPU, 1 GiB Memory',
    };

    const found = {
      name: await resourceTitle.getText(),
      status: await vmi.getStatus(),
      description: await vmView.vmDetailDesc(testName, vmiName).getText(),
      os: await vmView.vmDetailOS(testName, vmiName).getText(),
      profile: await vmView.vmDetailWorkloadProfile(testName, vmiName).getText(),
      bootOrderTexts: await vmView.vmDetailBootOrder(testName, vmiName).getText(),
      flavorText: await vmiDetailFlavor(testName, vmiName).getText(),
    };

    const equal = _.isEqual(found, expectation);
    if (!equal) {
      // eslint-disable-next-line no-console
      console.error(`Expected:\n${JSON.stringify(expectation)},\nGot:\n${JSON.stringify(found)}`);
    }
    expect(equal).toBe(true);

    expect(await vmView.vmDetailIP(testName, vmiName).getText()).not.toEqual(NOT_AVAILABLE);
    expect(
      await vmView
        .vmDetailPod(testName, vmiName)
        .$('a')
        .getText(),
    ).toContain('virt-launcher');
    expect(
      await vmView
        .vmDetailNode(testName, vmiName)
        .$('a')
        .getText(),
    ).not.toEqual(NOT_AVAILABLE);
  });

  it('ID(CNV-3704) Check VMI services', async () => {
    await asyncForEach(nodePortServices, async (srv) => {
      expect(await vmView.vmDetailService(srv.exposeName).getText()).toEqual(srv.exposeName);
      expect(await vmView.vmDetailService(srv.exposeName).getAttribute('href')).toContain(
        `/k8s/ns/${testName}/services/${srv.exposeName}`,
      );
    });
  });
});
