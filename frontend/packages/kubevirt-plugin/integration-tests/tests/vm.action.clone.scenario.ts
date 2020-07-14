/* eslint-disable no-undef, max-nested-callbacks */
import * as _ from 'lodash';
import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import {
  filterForName,
  isLoaded,
  resourceRowsPresent,
  resourceRows,
} from '@console/internal-integration-tests/views/crud.view';
import {
  removeLeakedResources,
  waitForCount,
  withResource,
  createResources,
  deleteResources,
  addLeakableResource,
  removeLeakableResource,
  asyncForEach,
} from '@console/shared/src/test-utils/utils';
import * as cloneDialogView from '../views/dialogs/cloneVirtualMachineDialog.view';
import { getVolumes, getDataVolumeTemplates } from '../../src/selectors/vm/selectors';
import { getRandStr, createProject } from './utils/utils';
import {
  CLONE_VM_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  CLONED_VM_BOOTUP_TIMEOUT_SECS,
} from './utils/constants/common';
import {
  multusNetworkInterface,
  multusNAD,
  getVMManifest,
  cloudInitCustomScriptConfig,
  rootDisk,
  datavolumeClonerClusterRole,
  provisionSources,
} from './mocks/mocks';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { VirtualMachine } from './models/virtualMachine';
import { CloneVirtualMachineDialog } from './dialogs/cloneVirtualMachineDialog';
import { VM_ACTION, VM_STATUS, TAB } from './utils/constants/vm';
import { VMBuilder } from './models/vmBuilder';
import { Disk } from './types/types';

describe('Test clone VM.', () => {
  const leakedResources = new Set<string>();
  const cloneDialog = new CloneVirtualMachineDialog();
  const testCloningNamespace = `${testName}-cloning`;

  beforeAll(async () => {
    await createProject(testCloningNamespace);
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualization`);
  });

  afterAll(() => {
    execSync(`kubectl delete namespace ${testCloningNamespace}`);
  });

  describe('Test Clone VM dialog validation', () => {
    const testContainerVM = getVMManifest('Container', testName);
    const vm = new VirtualMachine(testContainerVM.metadata);
    const testNameValidationVM = getVMManifest(
      'Container',
      testCloningNamespace,
      testContainerVM.metadata.name,
    );

    beforeAll(async () => {
      createResources([testContainerVM, testNameValidationVM]);
    });

    afterAll(() => {
      deleteResources([testContainerVM, testNameValidationVM]);
    });

    it(
      'ID(CNV-1730) Displays warning in clone wizard when cloned vm is running.',
      async () => {
        await vm.detailViewAction(VM_ACTION.Start, false);
        await vm.waitForStatus(VM_STATUS.Starting, PAGE_LOAD_TIMEOUT_SECS);
        await vm.detailViewAction(VM_ACTION.Clone);
        await browser.wait(
          until.and(
            until.presenceOf(cloneDialogView.warningMessage),
            until.textToBePresentInElement(
              cloneDialogView.warningMessage,
              `${vm.name} is still running.`,
            ),
          ),
          PAGE_LOAD_TIMEOUT_SECS,
        );
        expect(cloneDialogView.confirmButton.isEnabled()).toBeTruthy();
        await cloneDialog.close();
        await vm.waitForStatus(VM_STATUS.Running, VM_BOOTUP_TIMEOUT_SECS);
        await vm.detailViewAction(VM_ACTION.Stop);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it('ID(CNV-1863) Prefills correct data in the clone VM dialog.', async () => {
      await vm.detailViewAction(VM_ACTION.Clone);
      expect(cloneDialogView.nameInput.getAttribute('value')).toEqual(`${vm.name}-clone`);
      expect(cloneDialogView.descriptionInput.getText()).toEqual(
        testContainerVM.metadata.annotations.description,
      );
      // Check preselected value of NS dropdown
      expect(cloneDialogView.namespaceSelector.getAttribute('value')).toEqual(vm.namespace);
      await cloneDialog.close();
    });

    it('ID(CNV-1732) Validates VM name.', async () => {
      await vm.detailViewAction(VM_ACTION.Clone);

      expect(cloneDialogView.warningMessage.isPresent()).toBe(false);

      // Check warning is displayed when VM has same name as existing VM
      await cloneDialog.fillName(vm.name);
      await browser.wait(until.presenceOf(cloneDialogView.nameHelperMessage));
      expect(cloneDialogView.nameHelperMessage.getText()).toMatch(/already used/);

      // Check warning is displayed when VM has same name as existing VM in another namespace
      await cloneDialog.fillName(testNameValidationVM.metadata.name);
      await cloneDialog.selectNamespace(testNameValidationVM.metadata.namespace);
      await browser.wait(until.presenceOf(cloneDialogView.nameHelperMessage));
      expect(cloneDialogView.nameHelperMessage.getText()).toMatch(/already used/);

      await cloneDialog.close();
    });
  });

  describe('Test cloning settings.', () => {
    const testVM = getVMManifest('URL', testName, `cloningvm-${getRandStr(5)}`);
    const vm = new VirtualMachine(testVM.metadata);
    const clonedVM = new VirtualMachine({
      name: `${vm.name}-clone`,
      namespace: vm.namespace,
    });

    const allowCloneRoleBinding = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: 'allow-clone-to-user',
        namespace: `${testName}`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: 'default',
          namespace: `${testCloningNamespace}`,
        },
      ],
      roleRef: {
        kind: 'ClusterRole',
        name: 'datavolume-cloner',
        apiGroup: 'rbac.authorization.k8s.io',
      },
    };

    beforeAll(async () => {
      createResources([multusNAD, testVM, datavolumeClonerClusterRole, allowCloneRoleBinding]);
      await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
      await vm.addNIC(multusNetworkInterface);
      await vm.detailViewAction(VM_ACTION.Start);
    }, VM_IMPORT_TIMEOUT_SECS + VM_BOOTUP_TIMEOUT_SECS);

    afterAll(() => {
      deleteResources([
        multusNAD,
        testVM,
        clonedVM.asResource(),
        datavolumeClonerClusterRole,
        allowCloneRoleBinding,
      ]);
      removeLeakableResource(leakedResources, clonedVM.asResource());
      removeLeakedResources(leakedResources);
    });

    it(
      'ID(CNV-3058) Clones VM to a different namespace',
      async () => {
        const vmClonedToOtherNS = new VirtualMachine({
          name: `${vm.name}-${getRandStr(4)}`,
          namespace: testCloningNamespace,
        });
        await vm.detailViewAction(VM_ACTION.Clone);
        await cloneDialog.fillName(vmClonedToOtherNS.name);
        await cloneDialog.selectNamespace(vmClonedToOtherNS.namespace);
        await cloneDialog.clone();
        await withResource(leakedResources, vmClonedToOtherNS.asResource(), async () => {
          await vmClonedToOtherNS.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
        });
      },
      VM_IMPORT_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-1733) Start cloned VM on creation',
      async () => {
        await vm.detailViewAction(VM_ACTION.Clone);
        await cloneDialog.startOnCreation();
        await cloneDialog.clone();
        addLeakableResource(leakedResources, clonedVM.asResource());

        await clonedVM.navigateToTab(TAB.Details);
      },
      VM_BOOTUP_TIMEOUT_SECS + CLONE_VM_TIMEOUT_SECS,
    );

    it('ID(CNV-2825) Running VM is stopped when cloned', async () => {
      await vm.waitForStatus(VM_STATUS.Off, PAGE_LOAD_TIMEOUT_SECS);
    });

    it('ID(CNV-1734) Cloned VM has changed MAC address.', async () => {
      await clonedVM.navigateToTab(TAB.NetworkInterfaces);
      await browser.wait(until.and(waitForCount(resourceRows, 2)), PAGE_LOAD_TIMEOUT_SECS);
      const addedNIC = (await clonedVM.getAttachedNICs()).find(
        (nic) => nic.name === multusNetworkInterface.name,
      );
      expect(addedNIC.mac === multusNetworkInterface.mac).toBe(false);
    });

    it('ID(CNV-1739) Cloned VM has vm.kubevirt.io/name label.', () => {
      expect(
        _.has(
          _.get(clonedVM.getResource(), 'spec.template.metadata.labels'),
          'vm.kubevirt.io/name',
        ),
      ).toBe(true);
    });
  });

  describe('Test DataVolumes of cloned VMs', () => {
    let vm: VirtualMachine;
    let clonedVM: VirtualMachine;

    beforeAll(async () => {
      vm = new VMBuilder(getBasicVMBuilder())
        .setProvisionSource(provisionSources.URL)
        .setDisks([rootDisk])
        .setCloudInit(cloudInitCustomScriptConfig)
        .setWaitForImport(true)
        .build();
      await vm.create();
      clonedVM = await vm.clone();
      await clonedVM.start();
    }, CLONED_VM_BOOTUP_TIMEOUT_SECS + VM_IMPORT_TIMEOUT_SECS);

    afterAll(async () => {
      deleteResources([vm.asResource(), clonedVM.asResource()]);
    });

    it('ID(CNV-1740) Test clone VM with URL source.', async () => {
      // Check cloned PVC exists
      await browser.get(`${appHost}/k8s/ns/${testName}/persistentvolumeclaims`);
      await isLoaded();
      await filterForName(clonedVM.name);
      await resourceRowsPresent();

      // Verify cloned disk dataVolumeTemplate is present in cloned VM manifest
      const clonedDataVolumeTemplate = getDataVolumeTemplates(clonedVM.getResource());
      const result = _.find(clonedDataVolumeTemplate, (o) =>
        o.metadata.name.includes(clonedVM.name),
      );
      expect(_.get(result, 'spec.source.pvc.name')).toContain(`${vm.name}-rootdisk`);
    });

    it('ID(CNV-1744) Test clone VM with URL source and Cloud Init.', async () => {
      const expectedDisks = await vm.getAttachedDisks();
      // Check disks on cloned VM
      await asyncForEach(expectedDisks, async (disk: Disk) => {
        expect(await clonedVM.hasDisk(disk)).toBeTruthy();
      });
      // Verify configuration of cloudinitdisk is the same
      const vmVolumes = getVolumes(vm.getResource());
      const result = _.find(vmVolumes, (o) => o.name === 'cloudinitdisk');
      expect(result).toBeDefined();
      expect(_.get(result, 'cloudInitNoCloud.userData')).toEqual(
        clonedVM.getData().cloudInit.customScript,
      );
    });
  });
});
