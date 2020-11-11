import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import {
  addLeakableResource,
  removeLeakedResources,
  click,
  withResource,
  withResources,
} from '@console/shared/src/test-utils/utils';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as loginView from '@console/internal-integration-tests/views/login.view';
import * as pvcView from '../views/pvc.view';
import { restrictedAccessBlock } from '../views/vms.list.view';
import { uploadLink } from '../views/wizard.view';
import { createProject } from './utils/utils';
import { RHEL7_IMAGE, VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/constants/common';
import { GOLDEN_OS_IMAGES_NS, FEDORA_PVC, RHEL7_PVC } from './utils/constants/pvc';
import { OperatingSystem } from './utils/constants/wizard';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VMBuilder } from './models/vmBuilder';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { rootDisk } from './mocks/mocks';
import { UploadForm } from './models/pvcUploadForm';
import { PVC } from './models/pvc';
import { Wizard } from './models/wizard';

const testNonAdminNamespace = `${testName}-non-admin`;
const KUBEADMIN_IDP = 'kube:admin';
const KUBEADMIN_USERNAME = 'kubeadmin';
const {
  BRIDGE_HTPASSWD_IDP = 'test',
  BRIDGE_HTPASSWD_USERNAME = 'test',
  BRIDGE_HTPASSWD_PASSWORD = 'test',
  BRIDGE_KUBEADMIN_PASSWORD,
} = process.env;

describe('Kubevirt non-admin Flow', () => {
  const leakedResources = new Set<string>();
  const pvc = new PVC(RHEL7_PVC);

  beforeAll(async () => {
    // Prepare golden pvc for normal user.
    execSync(`test -f ${pvc.image} || curl --fail ${RHEL7_IMAGE} -o ${pvc.image}`);
    await pvc.create();
    addLeakableResource(leakedResources, pvc.getDVResource());

    await loginView.logout();
    await loginView.login(BRIDGE_HTPASSWD_IDP, BRIDGE_HTPASSWD_USERNAME, BRIDGE_HTPASSWD_PASSWORD);
    await createProject(testNonAdminNamespace);
  });

  afterAll(async () => {
    execSync(`rm ${pvc.image}`);
    removeLeakedResources(leakedResources);
    execSync(`kubectl delete --ignore-not-found=true project ${testNonAdminNamespace}`);

    await loginView.logout();
    await loginView.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, BRIDGE_KUBEADMIN_PASSWORD);
  });

  describe('Kubevirt non-admin virtualization Flow', () => {
    const vm = new VMBuilder(getBasicVMBuilder())
      .setNamespace(testNonAdminNamespace)
      .setProvisionSource(ProvisionSource.URL)
      .setDisks([rootDisk])
      .build();

    it(
      'ID(CNV-1718) Non-admin create and remove a vm in its own namespace',
      async () => {
        await browser.get(`${appHost}/k8s/ns/${testNonAdminNamespace}/virtualization`);
        await crudView.isLoaded();
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.create();
          await vm.navigateToDetail();
        });
      },
      VM_CREATE_AND_EDIT_TIMEOUT_SECS,
    );

    it('ID(CNV-1720) Non-admin cannot create vm in a foreign namespace', async () => {
      // Check access is restricted on foreign namespace.
      await browser.get(`${appHost}/k8s/ns/default/virtualmachines`);
      await browser.wait(
        until.textToBePresentInElement(restrictedAccessBlock, 'Restricted Access'),
      );
    });
  });

  describe('Kubevirt non-admin PVC Flow', () => {
    const vm = new VMBuilder(getBasicVMBuilder())
      .setNamespace(testNonAdminNamespace)
      .setOS(pvc.os)
      .setStartOnCreation(true)
      .generateNameForPrefix('auto-clone-vm-with-normal-user')
      .build();

    it('ID(CNV-5039) Non-admin cannot create golden pvc', async () => {
      await browser.get(`${appHost}/k8s/ns/${testNonAdminNamespace}/persistentvolumeclaims`);
      const uploadForm = new UploadForm();
      FEDORA_PVC.image = pvc.image;
      await uploadForm.upload(FEDORA_PVC);
      await click(crudView.saveChangesBtn);
      await browser.wait(until.presenceOf(crudView.errorMessage));
      expect(pvcView.errorUploading.getText()).toContain('forbidden');
    });

    it('ID(CNV-5040) Non-admin cannot delete golden pvc', async () => {
      await browser.get(`${appHost}/k8s/ns/${GOLDEN_OS_IMAGES_NS}/persistentvolumeclaims`);
      await crudView.resourceRowsPresent();
      await crudView.filterForName(pvc.name);
      await crudView.isLoaded();
      await click(pvcView.pvcKebabButton);
      expect(pvcView.pvcDeleteButton.getAttribute('class')).toContain('pf-m-disabled');
    });

    it('ID(CNV-5055) Non-admin has no link on wizard page to upload data', async () => {
      await browser.get(`${appHost}/k8s/ns/${testNonAdminNamespace}/virtualization`);
      const wizard = new Wizard();
      await wizard.openWizard(VirtualMachineModel);
      await wizard.selectOperatingSystem(OperatingSystem.RHEL8);
      expect(uploadLink.isPresent()).toBe(false);
      await wizard.closeWizard();
    });

    it(
      'ID(CNV-4893) Non-admin can create vm from golden os template',
      async () => {
        await withResources(leakedResources, [vm.asResource(), pvc.getDVResource()], async () => {
          await vm.create();
          await vm.navigateToDetail();
        });
      },
      VM_CREATE_AND_EDIT_TIMEOUT_SECS,
    );
  });
});
