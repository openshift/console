/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { click, fillInput } from '@console/shared/src/test-utils/utils';
import * as view from '../../views/importWizard.view';
import * as rhvView from '../../views/rhvImportWizard.view';
import * as wizardView from '../../views/wizard.view';
import { InstanceConfig, rhvConfig, VMImportConfig } from '../types/types';
import {
  IMPORT_WIZARD_CONN_NAME_PREFIX,
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  PAGE_LOAD_TIMEOUT_SECS,
  WIZARD_STARTED_IMPORT,
} from '../utils/constants/common';
import { selectOptionByText, setCheckboxState } from '../utils/utils';
import { ImportWizard } from './importWizard';
import { VirtualMachine } from './virtualMachine';

export class RhvImportWizard extends ImportWizard {
  async fillApi(apiUrl: string) {
    await fillInput(rhvView.ovirtApiInput, apiUrl);
  }

  async fillUsername(username: string) {
    await fillInput(rhvView.ovirtUsernameInput, username);
  }

  async fillPassword(password: string) {
    await fillInput(rhvView.ovirtPasswordInput, password);
  }

  async fillCertificate(certificate: string) {
    await fillInput(rhvView.ovirtCertInput, certificate);
  }

  async selectCluster(instanceConfig: rhvConfig) {
    await selectOptionByText(rhvView.ovirtClusterSelect, instanceConfig.cluster);
  }

  async saveInstance(saveInstance: boolean) {
    await setCheckboxState(rhvView.connectRhvInstanceButton, saveInstance);
  }

  async configureProvider(instanceConfig: rhvConfig) {
    await this.fillApi(instanceConfig.apiUrl);
    await this.fillCertificate(instanceConfig.certificate);
    await this.fillUsername(instanceConfig.username);
    await this.fillPassword(instanceConfig.password);
    await this.saveInstance(instanceConfig.saveInstance);
  }

  async configureInstance(instanceConfig: InstanceConfig) {
    if (instanceConfig.instance === IMPORT_WIZARD_CONN_TO_NEW_INSTANCE) {
      await selectOptionByText(rhvView.ovirtInstanceSelect, instanceConfig.instance);
      await this.configureProvider(instanceConfig);
      await this.connectToInstance();
    } else if (instanceConfig.instance.includes(IMPORT_WIZARD_CONN_NAME_PREFIX)) {
      await this.selectInstanceByPrefixName(rhvView.ovirtInstanceSelect);
    } else {
      throw Error('No RHV instance was found');
    }
  }

  async connectToInstance() {
    await click(rhvView.connectRhvInstanceButton);
  }

  async selectSourceVirtualMachine(sourceVirtualMachine: string) {
    await selectOptionByText(rhvView.ovirtVmSelect, sourceVirtualMachine);
  }

  async waitForCreation() {
    await browser.wait(
      until.textToBePresentInElement(wizardView.creationSuccessResult, WIZARD_STARTED_IMPORT),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }

  async importVmConnectProviderStep(config) {
    const { provider, instanceConfig, sourceVMName } = config;
    // Establishing connection:
    await this.selectProvider(provider);
    await this.waitForSpinner();
    await this.configureInstance(instanceConfig);
    await this.waitForSpinner();

    // Selecting RHV cluster
    await this.selectCluster(instanceConfig);
    // Selecting source VM
    await this.selectSourceVirtualMachine(sourceVMName);
    await this.waitForSpinner();
    // Clicking `edit` button to reach network and storage settings
    await this.edit(config);
    await browser.sleep(2000);
    await click(view.nextButton);
  }

  async importVmConfigStep(config) {
    const { name, description } = config;
    // Impossible to do changes of flavor, workload profile and/or OS, only VM name and description can be updated
    if (name) {
      await this.fillName(name);
    }
    if (description) {
      await this.fillDescription(description);
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
    // CloudInit page is in read-only mode
    await this.next();

    // Review
    await this.processReviewStep(config);
    // Import
    await this.confirmAndCreate();
    await this.waitForCreation();

    // The rest is relevant for both VMWare and RHV
    return new VirtualMachine({ name, namespace: testName });
  }
}
