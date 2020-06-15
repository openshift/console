import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import * as virtualMachineView from '../views/virtualMachine.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest } from './utils/mocks';
import { getRandStr } from './utils/utils';
import { MatchLabels } from '@console/internal/module/k8s';

describe('KubeVirt VM detail - edit Node Selector', () => {
  const testVM = getVMManifest('Container', testName, `node-selector-vm-${getRandStr(5)}`);
  const vm: VirtualMachine = new VirtualMachine(testVM.metadata);
  const labels: MatchLabels = {
    key1: 'value1',
    key2: 'value2',
  };

  beforeAll(async () => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  it(
    'ID(CNV-4133) Adds a Node Selector, then removes it',
    async () => {
      await vm.addNodeSelectors(labels);
      await browser.wait(
        until.and(
          until.textToBePresentInElement(
            virtualMachineView.vmDetailNodeSelector(vm.namespace, vm.name),
            `key1=${labels.key1}`,
          ),
          until.textToBePresentInElement(
            virtualMachineView.vmDetailNodeSelector(vm.namespace, vm.name),
            `key2=${labels.key2}`,
          ),
        ),
      );
      await vm.deleteNodeSelectors(Object.keys(labels));
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailNodeSelector(vm.namespace, vm.name),
          'No selector',
        ),
      );
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
