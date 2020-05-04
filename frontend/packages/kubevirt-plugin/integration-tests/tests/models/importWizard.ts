import { browser, ExpectedConditions as until } from 'protractor';
import { createItemButton, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { click, fillInput, asyncForEach } from '@console/shared/src/test-utils/utils';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { tableRows, saveButton } from '../../views/kubevirtUIResource.view';
import { selectOptionByText, setCheckboxState } from '../utils/utils';
import {
  POD_CREATION_TIMEOUT_SECS,
  V2V_INSTANCE_CONNECTION_TIMEOUT,
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  networkTabCol,
  STORAGE_CLASS,
} from '../utils/consts';
import * as view from '../../views/importWizard.view';
import { waitForNoLoaders, clickKebabAction } from '../../views/wizard.view';
import { InstanceConfig } from '../utils/types';
import { Wizard } from './wizard';

export class ImportWizard extends Wizard {
  async openWizard() {
    await click(createItemButton);
    await click(view.importWithWizardButton);
    await waitForNoLoaders();
  }

  async selectProvider(provider: string) {
    await selectOptionByText(view.providerSelect, provider);
  }

  async selectInstance(instance: string) {
    await selectOptionByText(view.vcenterInstanceSelect, instance);
  }

  async fillHostname(hostname: string) {
    await fillInput(view.vcenterHostnameInput, hostname);
  }

  async fillUsername(username: string) {
    await fillInput(view.usernameInput, username);
  }

  async fillPassword(password: string) {
    await fillInput(view.vcenterPasswordInput, password);
  }

  async saveInstance(saveInstance: boolean) {
    await setCheckboxState(view.vcenterSaveInstanceCheckbox, saveInstance);
  }

  async configureInstance(instanceConfig: InstanceConfig) {
    await selectOptionByText(view.vcenterInstanceSelect, instanceConfig.instance);
    if (instanceConfig.instance === IMPORT_WIZARD_CONN_TO_NEW_INSTANCE) {
      await this.fillHostname(instanceConfig.hostname);
      await this.fillUsername(instanceConfig.username);
      await this.fillPassword(instanceConfig.password);
      await this.saveInstance(instanceConfig.saveInstance);
    } else {
      throw Error('Saved provider instances are not implemented');
    }
  }

  async connectToInstance() {
    await click(view.connectInstanceButton);
  }

  async selectSourceVirtualMachine(sourceVirtualMachine: string) {
    await selectOptionByText(view.virtualMachineSelect, sourceVirtualMachine);
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
      // Change name to comply with k8s
      await NICDialog.fillName(NIC.name.replace(/\s/g, '').toLowerCase());
      if (networks.length > 0) {
        await NICDialog.selectNetwork(networks[networks.length - 1]);
      } else {
        throw Error('No available networks to assign imported NICs');
      }
      await await click(saveButton);
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
      // Change name to comply with k8s
      await diskDialog.fillName(disk.name.replace(/\s/g, '').toLowerCase());
      await diskDialog.selectStorageClass(disk.storageClass);
      await click(saveButton);
      await waitForNoLoaders();
    });
  }

  async navigateToDetail() {
    await click(view.seeDetailPageButton);
    await isLoaded();
  }

  async waitForVMWarePod() {
    await browser.wait(until.invisibilityOf(view.vmwarePodStatusLoader), POD_CREATION_TIMEOUT_SECS);
  }

  async waitForInstanceSync() {
    await browser.wait(
      until.invisibilityOf(view.instanceConnectionStatus),
      V2V_INSTANCE_CONNECTION_TIMEOUT,
    );
  }
}
