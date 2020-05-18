/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { createItemButton, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { click, fillInput, asyncForEach } from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
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
  VIRTUALIZATION_TITLE,
} from '../utils/consts';
import * as view from '../../views/importWizard.view';
import { waitForNoLoaders, clickKebabAction } from '../../views/wizard.view';
import { InstanceConfig, VirtualMachineTemplateModel, VMImportConfig } from '../utils/types';
import { Wizard } from './wizard';
import { virtualizationTitle } from '../../views/vms.list.view';
import { K8sKind } from '@console/internal/module/k8s';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { resourceHorizontalTab } from '../../views/uiResource.view';
import { VirtualMachine } from './virtualMachine';
import { testName } from '@console/internal-integration-tests/protractor.conf';

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

  async waitForVMWarePod() {
    await browser.wait(until.invisibilityOf(view.vmwarePodStatusLoader), POD_CREATION_TIMEOUT_SECS);
  }

  async waitForInstanceSync() {
    await browser.wait(
      until.invisibilityOf(view.instanceConnectionStatus),
      V2V_INSTANCE_CONNECTION_TIMEOUT,
    );
  }

  async import(config: VMImportConfig) {
    const {
      provider,
      instanceConfig,
      sourceVMName,
      name,
      description,
      operatingSystem,
      flavorConfig,
      workloadProfile,
      storageResources,
      networkResources,
      cloudInit,
    } = config;
    const importWizard = new ImportWizard();
    await importWizard.openWizard(VirtualMachineModel);

    // General section
    await importWizard.selectProvider(provider);
    await importWizard.waitForVMWarePod();
    await importWizard.configureInstance(instanceConfig);

    await importWizard.connectToInstance();
    await importWizard.waitForInstanceSync();

    await importWizard.selectSourceVirtualMachine(sourceVMName);
    await importWizard.waitForInstanceSync();

    if (operatingSystem) {
      await importWizard.selectOperatingSystem(operatingSystem as string);
    }
    if (flavorConfig) {
      await importWizard.selectFlavor(flavorConfig);
    }
    if (workloadProfile) {
      await importWizard.selectWorkloadProfile(workloadProfile);
    }
    if (name) {
      await importWizard.fillName(name);
    }
    if (description) {
      await importWizard.fillDescription(description);
    }
    await importWizard.next();
    // Networking
    // First update imported network interfaces to comply with k8s
    await importWizard.updateImportedNICs();
    // Optionally add new interfaces, if any
    if (networkResources) {
      for (const NIC of networkResources) {
        await importWizard.addNIC(NIC);
      }
    }
    await importWizard.next();

    // Storage
    // First update disks that come from the source VM
    await importWizard.updateImportedDisks();
    // Optionally add new disks
    if (networkResources) {
      for (const disk of storageResources) {
        await importWizard.addDisk(disk);
      }
    }
    await importWizard.next();

    // Advanced - Cloud Init
    if (cloudInit) {
      await importWizard.configureCloudInit(cloudInit);
    }
    await importWizard.next();

    // Advanced - Virtual HW
    await importWizard.next();

    // Review
    await this.validateReviewTab(config);

    // Import
    await importWizard.confirmAndCreate();
    await importWizard.waitForCreation();

    // Navigate to detail page
    await importWizard.navigateToDetail();

    return new VirtualMachine({ name, namespace: testName });
  }
}
