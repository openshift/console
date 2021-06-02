/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { asyncForEach, click, fillInput } from '@console/shared/src/test-utils/utils';
import * as view from '../../views/importWizard.view';
import * as wizardView from '../../views/wizard.view';
import { InstanceConfig, VMImportConfig, vmwareConfig } from '../types/types';
import {
  IMPORT_WIZARD_CONN_NAME_PREFIX,
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  PAGE_LOAD_TIMEOUT_SECS,
  WIZARD_STARTED_IMPORT,
} from '../utils/constants/common';
import { selectOptionByText, setCheckboxState } from '../utils/utils';
import { ImportWizard } from './importWizard';
import { VirtualMachine } from './virtualMachine';

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
    if (instanceConfig.instance === IMPORT_WIZARD_CONN_TO_NEW_INSTANCE) {
      await selectOptionByText(view.vcenterInstanceSelect, instanceConfig.instance);
      await this.configureProvider(instanceConfig);
      await this.connectToInstance();
    } else if (instanceConfig.instance.includes(IMPORT_WIZARD_CONN_NAME_PREFIX)) {
      await this.selectInstanceByPrefixName(view.vcenterInstanceSelect);
    } else {
      throw Error('Mo VMWare instance was found');
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
      until.textToBePresentInElement(wizardView.creationSuccessResult, WIZARD_STARTED_IMPORT),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }

  async navigateToDetail() {
    await click(view.seeDetailPageButton);
    await isLoaded();
  }

  async updateImportedNICs() {
    const importedNICs = await this.getImportedNics();
    await asyncForEach(importedNICs, async (nic) => {
      return this.updateNic(nic);
    });
  }

  async importVmConnectProviderStep(config) {
    const { provider, instanceConfig, sourceVMName } = config;
    // Establishing connection:
    await this.selectProvider(provider);
    await this.waitForSpinner();
    await this.configureInstance(instanceConfig);

    await this.waitForSpinner();

    await this.selectSourceVirtualMachine(sourceVMName);
    await this.waitForSpinner();
    await click(view.nextButton);
  }

  async importVmConfigStep(config: VMImportConfig) {
    const { name, description, operatingSystem, flavorConfig, workloadProfile } = config;
    if (name) {
      await this.fillName(name);
    }
    if (description) {
      await this.fillDescription(description);
    }
    if (operatingSystem) {
      await this.selectOperatingSystem(operatingSystem as string);
    }
    if (flavorConfig) {
      await this.selectFlavor(flavorConfig);
    }
    if (workloadProfile) {
      await this.selectWorkloadProfile(workloadProfile);
    }
    await click(view.nextButton);
  }

  async import(config: VMImportConfig) {
    const { name } = config;
    await this.openWizard(VirtualMachineModel);

    await this.importVmConnectProviderStep(config);
    await this.importVmConfigStep(config);
    await this.importNetworkStep(config);
    await this.importDiskStep(config);

    await this.processAdvanceStep(config);

    // Review
    await this.processReviewStep(config);

    // Import
    await this.confirmAndCreate();
    await this.waitForCreation();

    // Navigate to detail page
    await this.navigateToDetail();
    return new VirtualMachine({ name, namespace: testName });
  }
}
