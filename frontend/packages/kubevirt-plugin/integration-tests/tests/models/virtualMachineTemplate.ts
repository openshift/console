/* eslint-disable no-unused-vars, no-undef, no-await-in-loop, no-console */
import { browser } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  errorMessage,
  filterForName,
  resourceRowsPresent,
} from '@console/internal-integration-tests/views/crud.view';
import { VMTemplateConfig } from '../utils/types';
import { WIZARD_CREATE_TEMPLATE_ERROR, WIZARD_TABLE_FIRST_ROW } from '../utils/consts';
import { Wizard } from './wizard';
import { KubevirtDetailView } from './kubevirtDetailView';

export class VirtualMachineTemplate extends KubevirtDetailView {
  constructor(templateConfig) {
    super({ ...templateConfig, kind: 'vmtemplates' });
  }

  async create({
    name,
    namespace,
    description,
    provisionSource,
    operatingSystem,
    flavor,
    workloadProfile,
    cloudInit,
    storageResources,
    networkResources,
  }: VMTemplateConfig) {
    await this.navigateToListView();

    // Basic Settings for VM template
    const wizard = new Wizard();
    await wizard.openWizard();
    await wizard.fillName(name);
    await wizard.fillDescription(description);
    if (!(await browser.getCurrentUrl()).includes(`${testName}/${this.kind}`)) {
      await wizard.selectNamespace(namespace);
    }
    await wizard.selectProvisionSource(provisionSource);
    await wizard.selectOperatingSystem(operatingSystem);
    await wizard.selectFlavor(flavor);
    await wizard.selectWorkloadProfile(workloadProfile);
    if (cloudInit.useCloudInit) {
      await wizard.useCloudInit(cloudInit);
    }
    await wizard.next();

    // Networking
    for (const resource of networkResources) {
      await wizard.addNIC(resource);
    }
    await wizard.next();

    // Storage
    for (const resource of storageResources) {
      if (resource.name === 'rootdisk' && provisionSource.method === 'URL') {
        // Rootdisk is present by default, only edit specific properties
        await wizard.editDiskAttribute(WIZARD_TABLE_FIRST_ROW, 'size', resource.size);
        await wizard.editDiskAttribute(WIZARD_TABLE_FIRST_ROW, 'storage', resource.storageClass);
      } else {
        await wizard.addDisk(resource);
      }
    }

    // Create VM template
    await wizard.next();
    await wizard.waitForCreation();

    // Check for errors and close wizard
    if (await errorMessage.isPresent()) {
      console.error(await errorMessage.getText());
      throw new Error(WIZARD_CREATE_TEMPLATE_ERROR);
    }
    await wizard.next();

    // Verify VM template is created
    await filterForName(name);
    await resourceRowsPresent();
  }

  asResource() {
    return {
      kind: 'template',
      metadata: {
        namespace: this.namespace,
        name: this.name,
      },
    };
  }
}
