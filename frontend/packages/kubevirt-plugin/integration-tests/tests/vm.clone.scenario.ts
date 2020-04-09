/* eslint-disable no-undef, max-nested-callbacks */
import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import * as _ from 'lodash';
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
  searchYAML,
  withResource,
  createResources,
  deleteResources,
  createResource,
  addLeakableResource,
  removeLeakableResource,
} from '@console/shared/src/test-utils/utils';
import * as cloneDialogView from '../views/dialogs/cloneVirtualMachineDialog.view';
import { getVolumes, getDataVolumeTemplates } from '../../src/selectors/vm/selectors';
import { getResourceObject, getRandStr, createProject } from './utils/utils';
import {
  CLONE_VM_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  CLONED_VM_BOOTUP_TIMEOUT_SECS,
  TAB,
  VM_ACTION,
  VM_STATUS,
} from './utils/consts';
import {
  basicVMConfig,
  multusNetworkInterface,
  multusNAD,
  getVMManifest,
  cloudInitCustomScriptConfig,
  rootDisk,
  datavolumeClonerClusterRole,
} from './utils/mocks';
import { VirtualMachine } from './models/virtualMachine';
import { CloneVirtualMachineDialog } from './dialogs/cloneVirtualMachineDialog';

describe('Test clone VM.', () => {
  const leakedResources = new Set<string>();
  const cloneDialog = new CloneVirtualMachineDialog();
  const testCloningNamespace = `${testName}-cloning`;

  beforeAll(async () => {
    await createProject(testCloningNamespace);
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
        await vm.action(VM_ACTION.Start, false);
        await vm.waitForStatus(VM_STATUS.Starting, PAGE_LOAD_TIMEOUT_SECS);
        await vm.action(VM_ACTION.Clone);
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
        await vm.action(VM_ACTION.Stop);
      },
      VM_BOOTUP_TIMEOUT_SECS,
    );

    it('ID(CNV-1863) Prefills correct data in the clone VM dialog.', async () => {
      await vm.action(VM_ACTION.Clone);
      expect(cloneDialogView.nameInput.getAttribute('value')).toEqual(`${vm.name}-clone`);
      expect(cloneDialogView.descriptionInput.getText()).toEqual(
        testContainerVM.metadata.annotations.description,
      );
      // Check preselected value of NS dropdown
      expect(cloneDialogView.namespaceSelector.getAttribute('value')).toEqual(vm.namespace);
      await cloneDialog.close();
    });

    it('ID(CNV-1732) Validates VM name.', async () => {
      await vm.action(VM_ACTION.Clone);

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
      await vm.action(VM_ACTION.Start);
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
        await vm.action(VM_ACTION.Clone);
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
        await vm.action(VM_ACTION.Clone);
        await cloneDialog.startOnCreation();
        await cloneDialog.clone();
        addLeakableResource(leakedResources, clonedVM.asResource());

        await clonedVM.navigateToTab(TAB.Details);
        await clonedVM.waitForStatus(VM_STATUS.Running, CLONE_VM_TIMEOUT_SECS);
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
        searchYAML(`vm.kubevirt.io/name: ${vm.name}`, clonedVM.name, clonedVM.namespace, 'vm'),
      ).toBeTruthy();
    });
  });

  describe('Test DataVolumes of cloned VMs', () => {
    const urlVMManifest = getVMManifest('URL', testName);
    const urlVM = new VirtualMachine(urlVMManifest.metadata);
    const cloudInitVmProvisionConfig = {
      method: 'URL',
      source: basicVMConfig.sourceURL,
    };

    it(
      'ID(CNV-1740) Test clone VM with URL source.',
      async () => {
        createResource(urlVMManifest);
        await withResource(leakedResources, urlVM.asResource(), async () => {
          await urlVM.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
          await urlVM.action(VM_ACTION.Start);
          await urlVM.action(VM_ACTION.Clone);
          await cloneDialog.clone();

          const clonedVM = new VirtualMachine({
            name: `${urlVM.name}-clone`,
            namespace: urlVM.namespace,
          });
          await withResource(leakedResources, clonedVM.asResource(), async () => {
            await clonedVM.action(VM_ACTION.Start, true, CLONED_VM_BOOTUP_TIMEOUT_SECS);

            // Check cloned PVC exists
            const clonedVMDiskName = `${clonedVM.name}-${urlVM.name}-rootdisk-clone`;
            await browser.get(`${appHost}/k8s/ns/${testName}/persistentvolumeclaims`);
            await isLoaded();
            await filterForName(clonedVMDiskName);
            await resourceRowsPresent();

            // Verify cloned disk dataVolumeTemplate is present in cloned VM manifest
            const clonedVMJSON = getResourceObject(
              clonedVM.name,
              clonedVM.namespace,
              clonedVM.kind,
            );
            const clonedDataVolumeTemplate = getDataVolumeTemplates(clonedVMJSON);
            const result = _.find(
              clonedDataVolumeTemplate,
              (o) => o.metadata.name === clonedVMDiskName,
            );
            expect(_.get(result, 'spec.source.pvc.name')).toEqual(`${urlVM.name}-rootdisk`);
          });
        });
      },
      CLONE_VM_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-1744) Test clone VM with URL source and Cloud Init.',
      async () => {
        const ciVMConfig = {
          name: `ci-${testName}`,
          namespace: testName,
          description: `Default description ${testName}`,
          provisionSource: cloudInitVmProvisionConfig,
          storageResources: [rootDisk],
          networkResources: [],
          flavorConfig: basicVMConfig.flavorConfig,
          operatingSystem: basicVMConfig.operatingSystem,
          workloadProfile: basicVMConfig.workloadProfile,
          startOnCreation: false,
          cloudInit: cloudInitCustomScriptConfig,
        };
        const expectedDisks = [
          rootDisk,
          { name: 'cloudinitdisk', size: '', interface: 'VirtIO', storageClass: '-' },
        ];
        const ciVM = new VirtualMachine(ciVMConfig);
        await ciVM.create(ciVMConfig);
        await withResource(leakedResources, ciVM.asResource(), async () => {
          await ciVM.action(VM_ACTION.Clone);
          await cloneDialog.clone();
          const clonedVM = new VirtualMachine({
            name: `${ciVMConfig.name}-clone`,
            namespace: ciVM.namespace,
          });
          await withResource(leakedResources, clonedVM.asResource(), async () => {
            // Check disks on cloned VM
            const disks = await clonedVM.getAttachedDisks();
            expectedDisks.forEach((disk) => {
              expect(_.find(disks, disk)).toBeDefined();
            });

            // Verify configuration of cloudinitdisk is the same
            const clonedVMJSON = getResourceObject(
              clonedVM.name,
              clonedVM.namespace,
              clonedVM.kind,
            );
            const clonedVMVolumes = getVolumes(clonedVMJSON);
            const result = _.find(clonedVMVolumes, (o) => o.name === 'cloudinitdisk');
            expect(result).toBeDefined();
            expect(_.get(result, 'cloudInitNoCloud.userData', '')).toEqual(
              cloudInitCustomScriptConfig.customScript,
            );

            // Verify the cloned VM can boot
            await clonedVM.action(VM_ACTION.Start, true, CLONED_VM_BOOTUP_TIMEOUT_SECS);
          });
        });
      },
      CLONE_VM_TIMEOUT_SECS,
    );
  });
});
