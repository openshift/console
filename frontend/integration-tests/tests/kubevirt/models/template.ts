/* eslint-disable no-unused-vars, no-undef */
import { browser } from 'protractor';

import { testName } from '../../../protractor.conf';
import { filterForName, resourceRowsPresent } from '../../../views/crud.view';
import { provisionOption, networkResource, storageResource, cloudInitConfig } from '../utils/utils';
import { WIZARD_CREATE_TEMPLATE_ERROR, WIZARD_TABLE_FIRST_ROW } from '../utils/consts';
import Wizard from './wizard';
import { errorMessage } from '../../../views/kubevirt/wizard.view';
import { KubevirtDetailView } from './kubevirtDetailView';


export class Template extends KubevirtDetailView {
  constructor(name: string, namespace: string) {
    super(name, namespace, 'templates');
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
  }: {
  name: string,
  namespace: string,
  description: string,
  provisionSource: provisionOption,
  operatingSystem: string,
  flavor: string,
  workloadProfile: string,
  cloudInit: cloudInitConfig,
  storageResources: storageResource[],
  networkResources: networkResource[],
  }) {
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
    for (const networkOption of networkResources) {
      await wizard.addNic(networkOption.name, networkOption.mac, networkOption.networkDefinition, networkOption.binding);
    }
    await wizard.next();

    // Storage
    for (const resource of storageResources) {
      if (resource.name === 'rootdisk' && provisionSource.method === 'URL') {
        // Rootdisk is present by default, only edit specific properties
        await wizard.editDiskAttribute(WIZARD_TABLE_FIRST_ROW, 'size', resource.size);
        await wizard.editDiskAttribute(WIZARD_TABLE_FIRST_ROW, 'storage', resource.storageClass);
      } else {
        await wizard.addDisk(resource.name, resource.size, resource.storageClass);
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
}
