import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { click, createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import * as virtualMachineView from '../views/virtualMachine.view';
import * as editAffinityView from '../views/dialogs/editAffinityView';
import { saveButton } from '../views/kubevirtUIResource.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/constants/common';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest } from './mocks/mocks';
import { getNodes, getRandStr, labelNode, taintNode } from './utils/utils';
import { MatchLabels } from '@console/internal/module/k8s';

describe('KubeVirt VM scheduling', () => {
  const testVM = getVMManifest('Container', testName, `vm-${getRandStr(5)}`);
  const vm: VirtualMachine = new VirtualMachine(testVM.metadata);
  const labels: MatchLabels = {
    key1: 'value1',
    key2: 'value2',
  };
  const labels1: MatchLabels = {
    key3: 'value3',
  };
  const nodes = getNodes();
  const node = nodes[nodes.length - 1];
  const fields: MatchLabels = {
    'metadata.name': node,
  };

  beforeAll(async () => {
    createResource(testVM);
  });

  afterAll(() => {
    deleteResource(testVM);
    labelNode(node, labels, false);
    labelNode(node, labels, false);
    labelNode(nodes[0], labels, false);
    for (let i = 0; i <= nodes.length - 2; i++) {
      taintNode(nodes[i], labels, 'NoSchedule', false);
    }
    taintNode(node, labels1, 'NoSchedule', false);
  });

  it(
    'ID(CNV-4489) VM is scheduled on labelled node',
    async () => {
      labelNode(node, labels, true);

      await vm.nodeSelectorsAction('add', labels);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailNodeSelector(vm.namespace, vm.name),
          `key1=${labels.key1}`,
        ),
      );

      await vm.start();
      const actualNode = virtualMachineView
        .vmDetailNode(testName, vm.name)
        .$('a')
        .getText();
      expect(actualNode).toContain(node);

      await vm.stop();
      await vm.nodeSelectorsAction('delete', labels);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailNodeSelector(vm.namespace, vm.name),
          'No selector',
        ),
      );
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4159) VM can be scheduling to node with affinity rules',
    async () => {
      labelNode(node, labels, true);
      labelNode(nodes[0], labels, true);

      await vm.navigateToDetail();
      await vm.modalEditAffinity();
      await click(editAffinityView.addAffinityBtn);
      await editAffinityView.affinityKeyInputByID('expression', 0).sendKeys('key1');
      await click(editAffinityView.valuesSelectElement.first());
      await editAffinityView.valuesSelectElement.sendKeys(labels.key1);
      await click(editAffinityView.createValueBtn(labels.key1));

      await click(editAffinityView.addLabelBtn.get(1));
      await editAffinityView.affinityKeyInputByID('field', 0).sendKeys('metadata.name');
      await click(editAffinityView.valuesSelectElement.get(1));
      await editAffinityView.valuesSelectElement.get(1).sendKeys(fields['metadata.name']);
      await click(editAffinityView.createValueBtn(fields['metadata.name']));

      await click(editAffinityView.editSubmitBtn);
      await click(saveButton);

      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailAffinity(vm.namespace, vm.name),
          '1 Affinity rules',
        ),
      );

      await vm.start();
      const actualNode = virtualMachineView
        .vmDetailNode(testName, vm.name)
        .$('a')
        .getText();
      expect(actualNode).toContain(node);

      await vm.stop();
      await vm.modalEditAffinity();
      await click(editAffinityView.kebab);
      await click(editAffinityView.kebabDelete);
      await click(saveButton);

      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailAffinity(vm.namespace, vm.name),
          'No Affinity rules',
        ),
      );
      labelNode(node, labels, false);
      labelNode(nodes[0], labels, false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4490) VM has no tolerations can only be scheduling to untainted node',
    async () => {
      for (let i = 0; i <= nodes.length - 2; i++) {
        taintNode(nodes[i], labels, 'NoSchedule', true);
      }

      await vm.start();
      const actualNode = virtualMachineView
        .vmDetailNode(testName, vm.name)
        .$('a')
        .getText();
      expect(actualNode).toContain(node);

      await vm.stop();
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4491) VM can be scheduling to tainted node with matched tolerations',
    async () => {
      for (let i = 0; i <= nodes.length - 2; i++) {
        taintNode(nodes[i], labels, 'NoSchedule', true);
      }
      taintNode(node, labels1, 'NoSchedule', true);

      await vm.tolerationsAction('add', labels1);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailTolerations(vm.namespace, vm.name),
          '1 Toleration rules',
        ),
      );

      await vm.start();
      const actualNode = virtualMachineView
        .vmDetailNode(testName, vm.name)
        .$('a')
        .getText();
      expect(actualNode).toContain(node);

      await vm.stop();
      await vm.tolerationsAction('delete', labels1);
      await browser.wait(
        until.textToBePresentInElement(
          virtualMachineView.vmDetailTolerations(vm.namespace, vm.name),
          'No Toleration rules',
        ),
      );
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
