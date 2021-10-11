import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, OS_IMAGES_NS, TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { pvc } from '../../views/pvc';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

const imageFormats = ['/tmp/cirros.iso', '/tmp/cirros.gz', '/tmp/cirros.xz'];
const invalidImage = '/tmp/cirros.txt';
const os = 'Red Hat Enterprise Linux 6.0 or higher - Default data image already exists';
const template = TEMPLATE.RHEL6;
const vmData: VirtualMachineData = {
  name: `pvc-test-vm-${testName}`,
  namespace: testName,
  template,
  sshEnable: false,
  startOnCreation: true,
  sourceAvailable: true,
};

describe('kubevirt PVC upload', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
    cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    cy.deleteTestProject(testName);
    cy.exec('rm -fr /tmp/cirros.*');
  });

  describe('test PVC upload via form', () => {
    it('ID(CNV-4778) No warning message shows when image format is supported', () => {
      pvc.form.open();
      for (const img of imageFormats) {
        cy.exec(`touch ${img} || true`);
        cy.dropFile(img, img.split('/').pop(), '.pf-c-file-upload');
        cy.get('.pf-c-alert__title')
          .contains('File type extension')
          .should('not.exist');
      }
    });

    it('ID(CNV-4891) It shows a warning message when image format is not supported', () => {
      pvc.form.open();
      cy.exec(`touch ${invalidImage} || true`);
      cy.dropFile(invalidImage, invalidImage.split('/').pop(), '.pf-c-file-upload');
      cy.contains('File type extension').should('be.visible');
    });

    it('ID(CNV-5176) It shows an error when uploading data to golden OS again', () => {
      cy.createDataVolume(template.dvName, OS_IMAGES_NS);
      pvc.form.open();
      pvc.form.selectOS(os);
      cy.get('.pf-c-alert__title')
        .contains('Operating system source already defined')
        .should('exist');
    });

    it('ID(CNV-5041) VM can be up after deleting the uploaded PVC', () => {
      vm.create(vmData);
      vm.stop();
      // only delete template pvc for ocs, hpp does not support this
      if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
        cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
      }
      vm.start();
      vm.delete();
    });
  });

  describe('test PVC upload via CLI', () => {
    it('ID(CNV-5044) Verify boot source is available for template after upload via CLI', () => {
      if (Cypress.env('DOWNSTREAM')) {
        cy.exec(
          `test -f ${Cypress.env(
            'UPLOAD_IMG',
          )} || curl --fail -L ${ProvisionSource.URL.getSource()} -o ${Cypress.env('UPLOAD_IMG')}`,
          { timeout: 600000 },
        );

        cy.uploadFromCLI(template.dvName, OS_IMAGES_NS, Cypress.env('UPLOAD_IMG'), '1');

        cy.visitVMTemplatesList();
        virtualization.templates.testSource(template.name, 'Unknown');
      }
    });

    it('ID(CNV-5597) Verify create VM from the template whose source is uploaded via CLI', () => {
      vm.create(vmData);
      vm.stop();
      vm.delete();
    });

    it('ID(CNV-5598) Delete DV/PVC from CLI', () => {
      cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
      cy.visitVMTemplatesList();
      virtualization.templates.testSource(template.name, 'Add source');
    });
  });
});
