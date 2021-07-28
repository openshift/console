import * as _ from 'lodash';
import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { getInterfaces } from '../../src/selectors/vm/selectors';
import { getVMIDisks } from '../../src/selectors/vmi/basic';
import {
  click,
  createResource,
  createResources,
  deleteResource,
  deleteResources,
  withResource,
} from '../utils/shared-utils';
import { nicModel, nicType } from '../views/dialogs/networkInterface.view';
import { createNICButton } from '../views/kubevirtUIResource.view';
import { dropDownItemMain, dropDownList } from '../views/uiResource.view';
import * as wizardView from '../views/wizard.view';
import { NetworkInterfaceDialog } from './dialogs/networkInterfaceDialog';
import {
  defaultPodNetworkingInterface,
  getVMManifest,
  hddDisk,
  multusNAD,
  multusNetworkInterface,
} from './mocks/mocks';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { VirtualMachine } from './models/virtualMachine';
import { VMBuilder } from './models/vmBuilder';
import { Wizard } from './models/wizard';
import {
  DEFAULT_YAML_VM_NAME,
  VM_ACTIONS_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
} from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { networkTabCol, NIC_MODEL, NIC_TYPE, VM_ACTION, VM_STATUS } from './utils/constants/vm';
import {
  createExampleVMViaYAML,
  getListTexts,
  getRandomMacAddress,
  getResourceObject,
  selectItemFromDropdown,
} from './utils/utils';

describe('Add/remove disks and NICs on respective VM pages', () => {
  const testVM = getVMManifest(ProvisionSource.URL, testName, `vm-disk-nic-${testName}`);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(async () => {
    createResources([multusNAD, testVM]);
    await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
  });

  afterAll(() => {
    deleteResources([multusNAD, testVM]);
  });

  it(
    'ID(CNV-1502) Add/remove disk on VM disks page',
    async () => {
      await vm.addDisk(hddDisk);
      expect(await vm.hasDisk(hddDisk)).toBeTruthy();
      await vm.detailViewAction(VM_ACTION.Start);
      const vmi = getResourceObject(vm.name, vm.namespace, 'VirtualMachineInstance');
      expect(_.find(getVMIDisks(vmi), (o) => o.name === hddDisk.name)).toBeDefined();
      await vm.detailViewAction(VM_ACTION.Stop);
      await vm.removeDisk(hddDisk.name);
      expect(await vm.hasDisk(hddDisk)).not.toBeTruthy();
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-1501) Add/remove nic on VM Network Interfaces page',
    async () => {
      await vm.addNIC(multusNetworkInterface);
      expect(await vm.hasNIC(multusNetworkInterface)).toBeTruthy();
      await vm.detailViewAction(VM_ACTION.Start);
      expect(
        _.find(getInterfaces(vm.getResource()), (o) => o.name === multusNetworkInterface.name),
      ).toBeDefined();
      await vm.detailViewAction(VM_ACTION.Stop);
      await vm.removeNIC(multusNetworkInterface.name);
      expect(await vm.hasNIC(multusNetworkInterface)).not.toBeTruthy();
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-1722) NIC can be added twice using one net-attach-def',
    async () => {
      const secondMultusInterface = {
        name: `nic2-${testName.slice(-5)}`,
        model: NIC_MODEL.VirtIO,
        mac: getRandomMacAddress(),
        type: NIC_TYPE.bridge,
        network: multusNAD.metadata.name,
      };
      await vm.addNIC(multusNetworkInterface);
      await vm.addNIC(secondMultusInterface);
      expect(await vm.hasNIC(multusNetworkInterface)).toBeTruthy();
      expect(await vm.hasNIC(secondMultusInterface)).toBeTruthy();
      await vm.detailViewAction(VM_ACTION.Start);
      const vmInterfaces = _.filter(
        getInterfaces(vm.getResource()),
        (o) => o.name === multusNetworkInterface.name || o.name === secondMultusInterface.name,
      );
      expect(vmInterfaces.length).toEqual(2);
      await vm.detailViewAction(VM_ACTION.Stop);
      await vm.removeNIC(multusNetworkInterface.name);
      await vm.removeNIC(secondMultusInterface.name);
      expect(await vm.hasNIC(multusNetworkInterface)).not.toBeTruthy();
      expect(await vm.hasNIC(secondMultusInterface)).not.toBeTruthy();
    },
    VM_ACTIONS_TIMEOUT_SECS,
  );
});

describe('Test network type presets and options', () => {
  const bindingMethods = [NIC_TYPE.bridge, NIC_TYPE.masquerade, NIC_TYPE.sriov].sort();
  const nonPodNetworkBindingMethods = [NIC_TYPE.bridge, NIC_TYPE.sriov].sort();
  const wizard = new Wizard();
  const leakedResources = new Set<string>();

  const vm = new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.URL)
    .setCustomize(true)
    .build();

  beforeAll(async () => {
    createResource(multusNAD);
  });

  afterAll(async () => {
    deleteResource(multusNAD);
  });

  it('ID(CNV-2073) Test NIC default type in VM Wizard', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualization`);
    await isLoaded();
    await wizard.openWizard(VirtualMachineModel, true);

    await wizard.processGeneralStep(vm.getData());

    // Default type for Pod Networking NIC is masquerade
    const podNic = await wizardView.tableRowAttribute(
      defaultPodNetworkingInterface.name,
      networkTabCol.type,
    );
    expect(podNic.toLowerCase()).toEqual(NIC_TYPE.masquerade.toLowerCase());

    // All type options are available for Pod Networking
    await click(wizardView.addNICButton);
    await click(nicType);
    const actualBindingMethods = await getListTexts(dropDownList);
    expect(actualBindingMethods.sort()).toEqual(bindingMethods);
    await click(dropDownList.get(0));
    await click(wizardView.modalCancelButton);
    await wizard.addNIC(multusNetworkInterface);
    await wizardView.clickKebabAction(multusNetworkInterface.name, 'Edit');
    // expect masquerade is not available option
    await click(nicType);
    const actualNonPodBindingMethods = await getListTexts(dropDownList);
    expect(actualNonPodBindingMethods.sort()).toEqual(nonPodNetworkBindingMethods);
    await click(dropDownList.get(0));
    await click(wizardView.modalCancelButton);
    await wizard.closeWizard();
  });

  it('ID(CNV-4038) Test NIC default type in example VM', async () => {
    await createExampleVMViaYAML();
    const exampleVM = new VirtualMachine({ name: DEFAULT_YAML_VM_NAME, namespace: testName });
    const NICDialog = new NetworkInterfaceDialog();
    await withResource(leakedResources, exampleVM.asResource(), async () => {
      await exampleVM.navigateToNICs();

      expect(
        _.findIndex(await exampleVM.getAttachedNICs(), (x) => {
          return _.isMatch(x, _.pick(defaultPodNetworkingInterface, ['name', 'model', 'network']));
        }) > -1,
      ).toBe(true);

      await click(createNICButton);
      await NICDialog.selectNetwork(multusNAD.metadata.name);
      await click(nicType);
      const actualNonPodBindingMethods = await getListTexts(dropDownList);
      expect(actualNonPodBindingMethods.sort()).toEqual(nonPodNetworkBindingMethods);
      await click(dropDownList.get(0));
      await exampleVM.navigateToListView();
    });
  });

  it('ID(CNV-4781) Test NIC supported models in VM Wizard', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualization`);
    await isLoaded();
    await wizard.openWizard(VirtualMachineModel, true);

    await wizard.processGeneralStep(vm.getData());

    await click(wizardView.addNICButton);
    await click(nicModel);
    const actualModels = await getListTexts(dropDownList);
    expect(actualModels).toEqual([NIC_MODEL.VirtIO, NIC_MODEL.e1000e]);
    await click(dropDownList.get(0));

    await click(wizardView.modalCancelButton);
    await wizard.closeWizard();
  });

  it('ID(CNV-4780) NIC model is disabled when sriov is selected in VM Wizard', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualization`);
    await isLoaded();
    await wizard.openWizard(VirtualMachineModel, true);

    await wizard.processGeneralStep(vm.getData());

    await click(wizardView.addNICButton);
    await selectItemFromDropdown(nicType, dropDownItemMain(NIC_TYPE.sriov));
    expect(nicModel.isEnabled()).toBe(false);

    await click(wizardView.modalCancelButton);
    await wizard.closeWizard();
  });
});
