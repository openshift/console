import { browser, ExpectedConditions as until } from 'protractor';
import {
  isLoaded,
  createItemButton,
  createYAMLLink,
  resourceTitle,
  errorMessage,
} from '@console/internal-integration-tests/views/crud.view';
import {
  isLoaded as yamlPageIsLoaded,
  saveButton,
  cancelButton,
  setEditorContent,
} from '@console/internal-integration-tests/views/yaml.view';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import {
  click,
  withResource,
  createResource,
  deleteResource,
} from '@console/shared/src/test-utils/utils';
import { VirtualMachine } from './models/virtualMachine';
import { VM_BOOTUP_TIMEOUT_SECS, PAGE_LOAD_TIMEOUT_SECS, VM_ACTIONS } from './utils/consts';
import { getVMManifest, multusNAD } from './utils/mocks';

describe('Test VM creation from YAML', () => {
  const leakedResources = new Set<string>();

  beforeAll(() => {
    createResource(multusNAD);
  });

  afterAll(() => {
    deleteResource(multusNAD);
  });

  beforeEach(async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();
    await click(createItemButton);
    await click(createYAMLLink);
    await yamlPageIsLoaded();
  });

  it(
    'Creates VM from default YAML.',
    async () => {
      const vm = new VirtualMachine({ name: 'example', namespace: testName });
      await withResource(leakedResources, vm.asResource(), async () => {
        await click(saveButton);
        await isLoaded();
        expect(resourceTitle.getText()).toEqual(vm.name);
        await vm.action(VM_ACTIONS.START);
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it('Fails to create VM from YAML if VM already exists.', async () => {
    createResource(getVMManifest('Container', testName, 'example'));
    const vm = new VirtualMachine({ name: 'example', namespace: testName });
    await withResource(leakedResources, vm.asResource(), async () => {
      await click(saveButton);
      await browser.wait(until.presenceOf(errorMessage), PAGE_LOAD_TIMEOUT_SECS);
      expect(errorMessage.getText()).toContain('already exists');
    });
  });

  it('Fails to create VM from invalid Manifest.', async () => {
    const vmManifest = getVMManifest('Container', testName);
    vmManifest.kind += testName.slice(-5); // malform VM manifest
    await setEditorContent(JSON.stringify(vmManifest));
    await click(saveButton);
    await browser.wait(until.presenceOf(errorMessage), PAGE_LOAD_TIMEOUT_SECS);
  });

  it('Cancel button on Create from YAML page redirects back to VM list.', async () => {
    await click(cancelButton);
    await browser.wait(
      until.textToBePresentInElement(resourceTitle, 'Virtual Machines'),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  });
});
