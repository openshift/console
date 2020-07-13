/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { click, fillInput } from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { selectOptionByText, setCheckboxState } from '../utils/utils';
import {
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  PAGE_LOAD_TIMEOUT_SECS,
  VMWARE_WIZARD_CREATE_SUCCESS,
} from '../utils/consts';
import * as view from '../../views/importWizard.view';
import { InstanceConfig, vmwareConfig, VMImportConfig } from '../utils/types';
import { VirtualMachine } from './virtualMachine';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import * as wizardView from '../../views/wizard.view';
import { ImportWizard } from './importWizard';

export class VmwareImportWizard extends ImportWizard {
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

  async configureProvider(instanceConfig: vmwareConfig) {
    await this.fillHostname(instanceConfig.hostname);
    await this.fillUsername(instanceConfig.username);
    await this.fillPassword(instanceConfig.password);
    await this.saveInstance(instanceConfig.saveInstance);
  }

  async configureInstance(instanceConfig: InstanceConfig) {
    await selectOptionByText(view.vcenterInstanceSelect, instanceConfig.instance);
    if (instanceConfig.instance === IMPORT_WIZARD_CONN_TO_NEW_INSTANCE) {
      await this.configureProvider(instanceConfig);
    } else {
      throw Error('Saved provider instances are not implemented');
    }
  }

  async connectToInstance() {
    await click(view.connectVmwareInstanceButton);
  }

  async selectSourceVirtualMachine(sourceVirtualMachine: string) {
    await selectOptionByText(view.virtualMachineSelect, sourceVirtualMachine);
  }

  async waitForCreation() {
    await browser.wait(
      until.textToBePresentInElement(
        wizardView.creationSuccessResult,
        VMWARE_WIZARD_CREATE_SUCCESS,
      ),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }

  async import(config: VMImportConfig) {
    const {
      provider,
      instanceConfig,
      name,
      sourceVMName,
      description,
      operatingSystem,
      flavorConfig,
      workloadProfile,
      storageResources,
      networkResources,
      cloudInit,
    } = config;
    await this.openWizard(VirtualMachineModel);

    // General section
    await this.selectProvider(provider);
    await this.waitForSpinner();
    await this.configureInstance(instanceConfig);

    await this.connectToInstance();
    await this.waitForSpinner();

    await this.selectSourceVirtualMachine(sourceVMName);
    await this.waitForSpinner();
    await click(view.nextButton);

    if (operatingSystem) {
      await this.selectOperatingSystem(operatingSystem as string);
    }
    if (flavorConfig) {
      await this.selectFlavor(flavorConfig);
    }
    if (workloadProfile) {
      await this.selectWorkloadProfile(workloadProfile);
    }
    if (name) {
      await this.fillName(name);
    }
    if (description) {
      await this.fillDescription(description);
    }
    await click(view.nextButton);

    // Networking
    // First update imported network interfaces to comply with k8s
    await this.updateImportedNICs();
    // Adding networks if any
    if (networkResources) {
      await this.addVmNetworks(networkResources);
    }
    await click(view.nextButton);
    // Storage
    // First update disks that come from the source VM
    await this.updateImportedDisks();
    // Adding disks if any
    if (storageResources) {
      await this.addVmStorage(storageResources);
    }
    await click(view.nextButton);

    // Advanced - Cloud Init
    if (cloudInit) {
      await this.configureCloudInit(cloudInit);
    }
    await this.next();

    // Advanced - Virtual HW
    await this.next();

    // Review
    await this.validateReviewTab(config);

    // Import
    await this.confirmAndCreate();
    await this.waitForCreation();

    // Navigate to detail page
    await this.navigateToDetail();
    return new VirtualMachine({ name, namespace: testName });
  }
}
