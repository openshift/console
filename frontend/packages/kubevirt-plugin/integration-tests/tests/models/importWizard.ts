/* eslint-disable no-await-in-loop */
import { browser } from 'protractor';
import { createItemButton, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { K8sKind } from '@console/internal/module/k8s';
import { asyncForEach, click } from '@console/shared/src/test-utils/utils';
import * as view from '../../views/importWizard.view';
import { saveButton, tableRows } from '../../views/kubevirtUIResource.view';
import * as rhvView from '../../views/rhvImportWizard.view';
import { resourceHorizontalTab } from '../../views/uiResource.view';
import { virtualizationTitle } from '../../views/vms.list.view';
import { clickKebabAction, waitForNoLoaders } from '../../views/wizard.view';
import { DiskDialog } from '../dialogs/diskDialog';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { Disk, Network, VirtualMachineTemplateModel } from '../types/types';
import {
  IMPORT_WIZARD_CONN_NAME_PREFIX,
  KEBAP_ACTION,
  STORAGE_CLASS,
  VIRTUALIZATION_TITLE,
  VOLUME_MODE,
} from '../utils/constants/common';
import { networkTabCol } from '../utils/constants/vm';
import { checkForError, getSelectOptions, selectOptionByText } from '../utils/utils';
import { Wizard } from './wizard';

export class ImportWizard extends Wizard {
  async openWizard(model: K8sKind) {
    if (
      !(await virtualizationTitle.isPresent()) ||
      (await virtualizationTitle.getText()) !== VIRTUALIZATION_TITLE
    ) {
      await clickNavLink(['Workloads', 'Virtualization']);
      await isLoaded();
      if (model === VirtualMachineTemplateModel) {
        await click(resourceHorizontalTab(VirtualMachineTemplateModel));
        await isLoaded();
      }
    }
    await click(createItemButton);
    await click(view.importWithWizardButton);
    await waitForNoLoaders();
  }

  async selectProvider(provider: string) {
    await selectOptionByText(view.providerSelect, provider);
  }

  async confirmAndCreate() {
    await click(view.importButton);
  }

  async selectInstanceByPrefixName(selector: any) {
    const instanceFullName = (await getSelectOptions(selector)).find((option) =>
      option.startsWith(IMPORT_WIZARD_CONN_NAME_PREFIX),
    );
    await selectOptionByText(selector, instanceFullName);
    await this.waitForSpinner();
  }

  /**
   * Edits attributes of a NICs that are being imported from source VM.
   */
  async updateNic(nic: Network) {
    const nicDialog = new NetworkInterfaceDialog();
    await clickKebabAction(nic.name, KEBAP_ACTION.Edit);
    await waitForNoLoaders();
    const networks = await nicDialog.getNetworks();
    if (networks.length > 0) {
      await nicDialog.selectNetwork(networks[networks.length - 1]);
      const err = await checkForError(view.errorHelper);
      if (err) {
        return err;
      }
    } else {
      throw Error('No available networks to assign imported NICs');
    }
    await click(view.confirmActionButton);
    await waitForNoLoaders();
    return null;
  }

  async getImportedNics() {
    const rows = await tableRows();
    return rows.map((line) => {
      const cols = line.split(/\n/);
      return {
        name: cols[networkTabCol.name],
      };
    });
  }

  async updateImportedNICs() {
    const importedNICs = await this.getImportedNics();
    // TODO: This is horrible, but unfortunately no better way to dynamically extract only device names
    // without using ElementArrayFinder, which on the other hand may cause NoStaleElement Exceptions
    // importedNICs = importedNICs.filter((_, i) => i % 11 === 0);
    await asyncForEach(importedNICs, async (nic) => {
      return this.updateNic(nic);
    });
  }

  /**
   * Edits attributes of Disks that are being imported from source VM.
   */

  async updateDisk(disk: Disk) {
    const diskDialog = new DiskDialog();
    await clickKebabAction(disk.name, KEBAP_ACTION.Edit);
    await waitForNoLoaders();
    await diskDialog.selectStorageClass(STORAGE_CLASS);
    // Configures volume mode if customized (block or filesystem)
    if (VOLUME_MODE) {
      await diskDialog.openAdvancedSettingsDrawer();
      await diskDialog.selectVolumeMode(VOLUME_MODE);
    }
    const err = await checkForError(view.errorHelper);
    if (err) {
      return err;
    }
    await click(saveButton);
    await waitForNoLoaders();
    return null;
  }

  async getImportedDisks() {
    const rows = await tableRows();
    return rows.map((line) => {
      const cols = line.split(/\n/);
      return {
        name: cols[networkTabCol.name],
        storageClass: STORAGE_CLASS,
      };
    });
  }

  async updateImportedDisks() {
    const importedDisks = await this.getImportedDisks();
    await asyncForEach(importedDisks, async (disk) => {
      await this.updateDisk(disk);
    });
  }

  async navigateToDetail() {
    await click(view.seeDetailPageButton);
    await isLoaded();
  }

  async importNetworkStep(config) {
    const { networkResources } = config;
    // Binding networks
    // First update imported network interfaces to comply with k8s
    await this.updateImportedNICs();
    // Adding networks if any
    if (networkResources) {
      await this.addVmNetworks(networkResources);
    }
    await this.next();
  }

  async importDiskStep(config) {
    const { storageResources } = config;
    // Binding storage disks
    // First update disks that come from the source VM
    await this.updateImportedDisks();
    // Adding disks if any
    if (storageResources) {
      await this.addVmStorage(storageResources);
    }
    await this.next();
  }

  async edit(config) {
    const { advancedEdit } = config;
    if (advancedEdit) {
      click(rhvView.editButton);
    }
  }

  /**
   * Waits for loading icon on Import tab to disappear.
   * As the icon disappears and re-appears several times when loading VM details
   * we need to sample it's presence multiple times to make sure all data is loaded.
   */
  async waitForSpinner() {
    // TODO: In a followup, we should use this implementation of waitFor and
    // deprecate the one we have in kubevirt-plugin/integration-tests/utils/utils.ts
    // because this is more general
    const waitFor = async (
      func: () => Promise<boolean>,
      interval = 1500,
      count = 4,
      attempts = 30,
    ) => {
      let sequenceNumber = 0;
      let attemptNumber = 0;
      let res;
      while (sequenceNumber !== count) {
        if (attemptNumber > attempts) {
          throw Error('Exceeded number of attempts');
        }
        res = await func();
        if (res) {
          sequenceNumber += 1;
        } else {
          sequenceNumber = 0;
        }
        attemptNumber += 1;
        await browser.sleep(interval);
      }
    };

    await waitFor(async () => {
      return !(await view.spinnerIcon.isPresent());
    });
  }

  async addVmNetworks(networkResources: Network[]) {
    if (networkResources) {
      for (const NIC of networkResources) {
        await this.addNIC(NIC);
      }
    }
  }

  async addVmStorage(storageResources: Disk[]) {
    if (storageResources) {
      for (const disk of storageResources) {
        await this.addDisk(disk);
      }
    }
  }
}
