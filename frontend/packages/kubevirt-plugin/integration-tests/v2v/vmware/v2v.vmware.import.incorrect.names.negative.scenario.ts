import { VirtualMachineModel } from '../../../src/models';
import { DiskDialog } from '../../tests/dialogs/diskDialog';
import { NetworkInterfaceDialog } from '../../tests/dialogs/networkInterfaceDialog';
import { v2vUIDeployment } from '../../tests/mocks/mocks';
import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';
import { KEBAP_ACTION } from '../../tests/utils/constants/common';
import { wrongValues } from '../../tests/utils/constants/vm';
import {
  asyncForEach,
  click,
  deleteResources,
  removeLeakedResources,
} from '../../utils/shared-utils';
import * as view from '../../views/importWizard.view';
import { clickKebabAction } from '../../views/wizard.view';
import { vmwareVMConfig } from './v2v.configs';

describe('VMWare Wizard validation, negative tests', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();

  afterAll(async () => {
    removeLeakedResources(leakedResources);
    deleteResources([v2vUIDeployment]);
  });

  beforeEach(async () => {
    await wizard.openWizard(VirtualMachineModel);
  });

  afterEach(async () => {
    await wizard.closeWizard();
  });

  it('VMWare - Import Wizard shows warning when using incorrect VM name', async () => {
    await wizard.importVmConnectProviderStep(vmwareVMConfig);
    await asyncForEach(wrongValues, async (curValue) => {
      const err = await wizard.fillName(curValue);
      expect(err).toBeDefined();
    });
  });

  it('VMWare - Import Wizard shows warning when using incorrect VM NIC name', async () => {
    await wizard.importVmConnectProviderStep(vmwareVMConfig);
    await wizard.importVmConfigStep(vmwareVMConfig);
    // Starting negative test for VM's NIC name
    const importedNICs = await wizard.getImportedNics();
    const nicDialog = new NetworkInterfaceDialog();
    if (importedNICs.length > 0) {
      const nic = importedNICs[0];
      await clickKebabAction(nic.name, KEBAP_ACTION.Edit);
      await asyncForEach(wrongValues, async (curValue) => {
        const err = await nicDialog.fillName(curValue);
        expect(err).toBeDefined();
      });
      await click(view.modalCancelButton);
    } else {
      pending('No network interfaces found');
    }
  });

  it('VMWare - Import Wizard shows warning when using incorrect VM disk name', async () => {
    await wizard.importVmConnectProviderStep(vmwareVMConfig);
    await wizard.importVmConfigStep(vmwareVMConfig);
    await wizard.importNetworkStep(vmwareVMConfig);
    // Starting negative test for VM's disk name
    const importedDisks = await wizard.getImportedDisks();
    const diskDialog = new DiskDialog();
    if (importedDisks.length > 0) {
      const disk = importedDisks[0];
      await clickKebabAction(disk.name, KEBAP_ACTION.Edit);
      await asyncForEach(wrongValues, async (curValue) => {
        const err = await diskDialog.fillName(curValue);
        expect(err).toBeDefined();
      });
      await click(view.modalCancelButton);
    } else {
      pending('No disk was found');
    }
  });
});
