/* eslint-disable no-await-in-loop */
import { browser } from 'protractor';
import { createItemButton, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { click, asyncForEach } from '@console/shared/src/test-utils/utils';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { tableRows, saveButton } from '../../views/kubevirtUIResource.view';
import { selectOptionByText } from '../utils/utils';
import { networkTabCol, STORAGE_CLASS, VIRTUALIZATION_TITLE } from '../utils/consts';
import * as view from '../../views/importWizard.view';
import { waitForNoLoaders, clickKebabAction } from '../../views/wizard.view';
import { VirtualMachineTemplateModel, NetworkResource, StorageResource } from '../utils/types';
import { Wizard } from './wizard';
import { virtualizationTitle } from '../../views/vms.list.view';
import { K8sKind } from '@console/internal/module/k8s';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { resourceHorizontalTab } from '../../views/uiResource.view';

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
    await click(view.importButon);
  }

  /**
   * Edits attributes of a NICs that are being imported from source VM.
   */
  async updateImportedNICs() {
    const rows = await tableRows();
    let importedNICs = rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[networkTabCol.name],
      };
    });
    // TODO: This is horrible, but unfortunately no better way to dynamically extract only device names
    // without using ElementArrayFinder, which on the other hand may cause NoStaleElement Exceptions
    importedNICs = importedNICs.filter((_, i) => i % 3 === 0);

    const NICDialog = new NetworkInterfaceDialog();
    await asyncForEach(importedNICs, async (NIC) => {
      await clickKebabAction(NIC.name, 'Edit');
      await waitForNoLoaders();
      const networks = await NICDialog.getNetworks();
      if (networks.length > 0) {
        await NICDialog.selectNetwork(networks[networks.length - 1]);
      } else {
        throw Error('No available networks to assign imported NICs');
      }
      await click(view.confirmActionButton);
      await waitForNoLoaders();
    });
  }

  /**
   * Edits attributes of Disks that are being imported from source VM.
   */
  async updateImportedDisks() {
    const rows = await tableRows();
    let importedDisks = rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[networkTabCol.name],
        storageClass: STORAGE_CLASS,
      };
    });
    importedDisks = importedDisks.filter((_, i) => i % 3 === 0);

    const diskDialog = new DiskDialog();
    await asyncForEach(importedDisks, async (disk) => {
      await clickKebabAction(disk.name, 'Edit');
      await waitForNoLoaders();
      // This if is required to workaround bug 1814611.
      // NFS is not supported for conversion PV and HPP should be used instead.
      if (disk.name === 'v2v-conversion-temp' && STORAGE_CLASS === 'nfs') {
        await diskDialog.selectStorageClass('hostpath-provisioner');
      } else {
        await diskDialog.selectStorageClass(disk.storageClass);
      }
      await click(saveButton);
      await waitForNoLoaders();
    });
  }

  async navigateToDetail() {
    await click(view.seeDetailPageButton);
    await isLoaded();
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

  async addVmNetworks(networkResources: NetworkResource[]) {
    if (networkResources) {
      for (const NIC of networkResources) {
        await this.addNIC(NIC);
      }
    }
  }

  async addVmStorage(storageResources: StorageResource[]) {
    if (storageResources) {
      for (const disk of storageResources) {
        await this.addDisk(disk);
      }
    }
  }
}
