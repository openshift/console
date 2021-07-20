import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  errorMessage,
  isLoaded,
  resourceTitle,
} from '@console/internal-integration-tests/views/crud.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import {
  cancelButton,
  isLoaded as yamlPageIsLoaded,
  saveButton,
  setEditorContent,
} from '@console/internal-integration-tests/views/yaml.view';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { click, createResource, deleteResource, withResource } from '../utils/shared-utils';
import { activeTab } from '../views/uiResource.view';
import { virtualizationTitle } from '../views/vms.list.view';
import { createItemButton, createWithYAMLButton } from '../views/wizard.view';
import { getVMManifest, multusNAD } from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import {
  DEFAULT_YAML_VM_NAME,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
} from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VM_ACTION } from './utils/constants/vm';

describe('Test VM creation from YAML', () => {
  const leakedResources = new Set<string>();

  beforeAll(() => {
    createResource(multusNAD);
  });

  afterAll(() => {
    deleteResource(multusNAD);
  });

  beforeEach(async () => {
    await clickNavLink(['Workloads', 'Virtualization']);
    await isLoaded();
    await click(createItemButton);
    await click(createWithYAMLButton);
    await yamlPageIsLoaded();
  });

  it(
    'ID(CNV-2941) Creates VM from default YAML.',
    async () => {
      const vm = new VirtualMachine({ name: DEFAULT_YAML_VM_NAME, namespace: testName });
      await withResource(leakedResources, vm.asResource(), async () => {
        await click(saveButton);
        await isLoaded();
        expect(resourceTitle.getText()).toEqual(vm.name);
        await vm.detailViewAction(VM_ACTION.Start);
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it('ID(CNV-2942) Fails to create VM from YAML if VM already exists.', async () => {
    createResource(getVMManifest(ProvisionSource.CONTAINER, testName, DEFAULT_YAML_VM_NAME));
    const vm = new VirtualMachine({ name: DEFAULT_YAML_VM_NAME, namespace: testName });
    await withResource(leakedResources, vm.asResource(), async () => {
      await click(saveButton);
      await browser.wait(until.presenceOf(errorMessage), PAGE_LOAD_TIMEOUT_SECS);
      expect(errorMessage.getText()).toContain('already exists');
    });
  });

  it('ID(CNV-2943) Fails to create VM from invalid Manifest.', async () => {
    const vmManifest = getVMManifest(ProvisionSource.CONTAINER, testName);
    vmManifest.kind += testName.slice(-5); // malform VM manifest
    await setEditorContent(JSON.stringify(vmManifest));
    await click(saveButton);
    await browser.wait(until.presenceOf(errorMessage), PAGE_LOAD_TIMEOUT_SECS);
  });

  it('ID(CNV-2944) Cancel button on Create from YAML page redirects back to VM list.', async () => {
    await click(cancelButton);
    await browser.wait(
      until.and(
        until.textToBePresentInElement(virtualizationTitle, 'Virtualization'),
        until.textToBePresentInElement(activeTab, VirtualMachineModel.labelPlural),
      ),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  });
});
