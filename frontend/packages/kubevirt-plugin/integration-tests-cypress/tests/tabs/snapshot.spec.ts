import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { K8S_KIND, YAML_VM_NAME, STATUS_READY, TEMPLATE } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import * as snapshotView from '../../views/snapshot';
import { tab } from '../../views/tab';
import { vm } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `test-vm-snapshot-${testName}`,
  description: 'rhel8 vm for snapshot',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const snapshotName = 'test-snapshot';

describe('Test vm snapshot', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.visitVMsList();
    vm.create(vmData);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    cy.deleteResource(K8S_KIND.VM, YAML_VM_NAME, testName);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-4717) Create/restore/delete vm snapshot', () => {
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToSnapshot();

    if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
      // create snapshot
      snapshotView.takeSnapshot(snapshotName);
      cy.get(snapshotView.status(snapshotName)).contains(STATUS_READY);

      // verify restore is disabled while VM is running
      cy.get(snapshotView.restoreBtn(snapshotName)).should('have.attr', 'aria-disabled', 'true');

      tab.navigateToDetails();
      vm.stop();
      tab.navigateToSnapshot();
      cy.get('.pf-c-table__text')
        .contains('Name')
        .should('be.visible');

      // restore snapshot
      cy.get(snapshotView.restoreBtn(snapshotName)).should('have.attr', 'aria-disabled', 'false');
      snapshotView.restoreSnapshot(snapshotName);
      cy.get(snapshotView.lastRestored(snapshotName)).contains('Just now');

      // delete snapshot
      snapshotView.deleteSnapshot();
      cy.get(snapshotView.snapshotRow(snapshotName)).should('not.exist');
    }

    if (Cypress.env('STORAGE_CLASS') === 'hostpath-provisioner') {
      snapshotView.warningNoDisksFound();
    }
  });

  it('ID(CNV-6844) It shows warning if there are no disks for snapshot', () => {
    cy.createDefaultVM();
    tab.navigateToSnapshot();
    snapshotView.warningNoDisksFound();
  });
});
