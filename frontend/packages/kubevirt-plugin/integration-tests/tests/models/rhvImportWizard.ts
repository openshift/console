/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { click, fillInput } from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { selectOptionByText, setCheckboxState } from '../utils/utils';
import { InstanceConfig, rhvConfig, VMImportConfig } from '../types/types';
import {
  IMPORT_WIZARD_CONN_TO_NEW_INSTANCE,
  RHV_WIZARD_CREATE_SUCCESS,
  PAGE_LOAD_TIMEOUT_SECS,
} from '../utils/constants/common';
import * as view from '../../views/importWizard.view';
import * as rhvView from '../../views/rhvImportWizard.view';
import { VirtualMachine } from './virtualMachine';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import * as wizardView from '../../views/wizard.view';
import { ImportWizard } from './importWizard';

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
    await selectOptionByText(rhvView.ovirtInstanceSelect, instanceConfig.instance);
    if (instanceConfig.instance === IMPORT_WIZARD_CONN_TO_NEW_INSTANCE) {
      await this.configureProvider(instanceConfig);
    } else {
      throw Error('Saved provider instances are not implemented');
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
      until.textToBePresentInElement(wizardView.creationSuccessResult, RHV_WIZARD_CREATE_SUCCESS),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  }

  async import(config: VMImportConfig) {
    const {
      provider,
      instanceConfig,
      name,
      description,
      sourceVMName,
      storageResources,
      networkResources,
      startOnCreation,
    } = config;
    await this.openWizard(VirtualMachineModel);

    // General section
    await this.selectProvider(provider);
    await this.waitForSpinner();
    await this.configureInstance(instanceConfig);
    await this.connectToInstance();
    await this.waitForSpinner();

    // Selecting RHV cluster
    await this.selectCluster(instanceConfig);
    // Selecting source VM
    await this.selectSourceVirtualMachine(sourceVMName);
    await this.waitForSpinner();
    // Clicking `edit` button to reach network and storage settings
    await click(rhvView.editButton);
    await click(view.nextButton);
    await this.next();
    // Impossible to do changes of flavor, workload profile and/or OS, only VM name and description can be updated
    if (name) {
      await this.fillName(name);
    }
    if (description) {
      await this.fillDescription(description);
    }
    await this.next();
    // Binding networks
    // First update imported network interfaces to comply with k8s
    await this.updateImportedNICs();
    // Adding networks if any
    if (networkResources) {
      await this.addVmNetworks(networkResources);
    }
    await this.next();

    // Binding storage disks
    // First update disks that come from the source VM
    await this.updateImportedDisks();
    // Adding disks if any
    if (storageResources) {
      await this.addVmStorage(storageResources);
    }
    await this.next();
    // CloudInit page is in read-only mode
    await this.next();
    // Additional devices page is in read-only mode
    await this.next();

    // Review
    await this.validateReviewTab(config);
    if (startOnCreation) {
      await this.startOnCreation();
    }

    // Import
    await this.confirmAndCreate();
    await this.waitForCreation();

    // The rest is relevant for both VMWare and RHV
    return new VirtualMachine({ name, namespace: testName });
  }
}
