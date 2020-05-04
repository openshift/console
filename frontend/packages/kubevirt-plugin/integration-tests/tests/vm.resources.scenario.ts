import * as _ from 'lodash';
import { browser, ExpectedConditions as until } from 'protractor';
import { testName, appHost } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import {
  click,
  createResources,
  deleteResources,
  createResource,
  deleteResource,
  withResource,
} from '@console/shared/src/test-utils/utils';
import { createNICButton } from '../views/kubevirtUIResource.view';
import { nicNetwork, nicType } from '../views/dialogs/networkInterface.view';
import { getInterfaces } from '../../src/selectors/vm/selectors';
import { getVMIDisks } from '../../src/selectors/vmi/basic';
import * as wizardView from '../views/wizard.view';
import {
  multusNAD,
  hddDisk,
  multusNetworkInterface,
  getVMManifest,
  basicVMConfig,
  defaultWizardPodNetworkingInterface,
  defaultYAMLPodNetworkingInterface,
} from './utils/mocks';
import { getSelectOptions, getRandStr, createExampleVMViaYAML } from './utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  TAB,
  VM_ACTION,
  NIC_TYPE,
  DISK_SOURCE,
  networkTabCol,
  DEFAULT_YAML_VM_NAME,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { Wizard } from './models/wizard';
import { NetworkInterfaceDialog } from './dialogs/networkInterfaceDialog';
import { VirtualMachineModel } from '../../src/models/index';

describe('Add/remove disks and NICs on respective VM pages', () => {
  const testVm = getVMManifest('Container', testName, `vm-disk-nic-${testName}`);
  const vm = new VirtualMachine(testVm.metadata);

  beforeAll(async () => {
    createResources([multusNAD, testVm]);
  }, VM_BOOTUP_TIMEOUT_SECS);

  afterAll(() => {
    deleteResources([multusNAD, testVm]);
  });

  it(
    'ID(CNV-1502) Add/remove disk on VM disks page',
    async () => {
      await vm.addDisk(hddDisk);
      expect(await vm.getAttachedDisks()).toContain(hddDisk);
      await vm.action(VM_ACTION.Start);
      expect(_.find(getVMIDisks(vm.getResource()), (o) => o.name === hddDisk.name)).toBeDefined();
      await vm.action(VM_ACTION.Stop);
      await vm.removeDisk(hddDisk.name);
      expect(await vm.getAttachedDisks()).not.toContain(hddDisk);
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-1501) Add/remove nic on VM Network Interfaces page',
    async () => {
      await vm.addNIC(multusNetworkInterface);
      expect(await vm.getAttachedNICs()).toContain(multusNetworkInterface);
      await vm.action(VM_ACTION.Start);
      expect(
        _.find(getInterfaces(vm.getResource()), (o) => o.name === multusNetworkInterface.name),
      ).toBeDefined();
      await vm.action(VM_ACTION.Stop);
      await vm.removeNIC(multusNetworkInterface.name);
      expect(await vm.getAttachedNICs()).not.toContain(multusNetworkInterface);
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );

  it('ID(CNV-1722) NIC cannot be added twice using one net-attach-def', async () => {
    await vm.navigateToTab(TAB.NetworkInterfaces);
    if (
      (await vm.getAttachedNICs()).filter((nic) => nic.name === multusNetworkInterface.name)
        .length === 0
    ) {
      await vm.addNIC(multusNetworkInterface);
    }

    // Verify the NIC is added in VM Manifest
    expect(
      _.find(getInterfaces(vm.getResource()), (o) => o.name === multusNetworkInterface.name),
    ).toBeDefined();

    // Try to add the NIC again
    await click(createNICButton, 1000);
    await browser.sleep(1000).then(() => browser.wait(until.presenceOf(nicNetwork)));

    // The network dropdown should be either empty (disabled) or not containing the already used net-attach-def
    await browser.wait(
      until.or(
        async () => {
          return !(await nicNetwork.isEnabled());
        },
        async () => {
          return !(await getSelectOptions(nicNetwork)).includes(multusNetworkInterface.network);
        },
      ),
    );
  });
});

describe('Test network type presets and options', () => {
  const bindingMethods = [
    NIC_TYPE.bridge,
    NIC_TYPE.masquerade,
    NIC_TYPE.slirp,
    NIC_TYPE.sriov,
  ].sort();
  const nonPodNetworkBindingMethods = [NIC_TYPE.bridge, NIC_TYPE.sriov].sort();
  const wizard = new Wizard();
  const leakedResources = new Set<string>();

  beforeAll(async () => {
    createResource(multusNAD);
  });

  afterAll(async () => {
    deleteResource(multusNAD);
  });

  it('ID(CNV-2073) Test NIC default type in VM Wizard', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualization`);
    await isLoaded();
    await wizard.openWizard(VirtualMachineModel);

    await wizard.fillName(getRandStr(5));
    await wizard.fillDescription(testName);
    await wizard.selectProvisionSource({
      method: DISK_SOURCE.Container,
      source: basicVMConfig.sourceContainer,
    });
    await wizard.selectOperatingSystem(basicVMConfig.operatingSystem);
    await wizard.selectFlavor(basicVMConfig.flavorConfig);
    await wizard.selectWorkloadProfile(basicVMConfig.workloadProfile);
    await wizard.next();

    // Default type for Pod Networking NIC is masquerade
    expect(
      wizardView.tableRowAttribute(defaultWizardPodNetworkingInterface.name, networkTabCol.type),
    ).toEqual(NIC_TYPE.masquerade);

    // All type options are available for Pod Networking
    await click(wizardView.addNICButton);
    expect((await getSelectOptions(nicType)).sort()).toEqual(bindingMethods);
    await click(wizardView.modalCancelButton);

    await wizard.addNIC(multusNetworkInterface);

    await wizardView.clickKebabAction(multusNetworkInterface.name, 'Edit');
    // expect masquerade is not available option
    expect((await getSelectOptions(nicType)).sort()).toEqual(nonPodNetworkBindingMethods);
  });

  xit('BZ(1828739) ID(CNV-4038) Test NIC default type in example VM', async () => {
    await createExampleVMViaYAML();
    const vm = new VirtualMachine({ name: DEFAULT_YAML_VM_NAME, namespace: testName });
    const NICDialog = new NetworkInterfaceDialog();
    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.navigateToTab(TAB.NetworkInterfaces);

      expect(
        _.findIndex(await vm.getAttachedNICs(), (x) => {
          return _.isMatch(
            x,
            _.pick(defaultYAMLPodNetworkingInterface, ['name', 'model', 'network']),
          );
        }) > -1,
      ).toBe(true);

      await click(createNICButton);
      await NICDialog.selectNetwork(multusNAD.metadata.name);
      expect((await getSelectOptions(nicType)).sort()).toEqual(nonPodNetworkBindingMethods);
    });
  });
});
