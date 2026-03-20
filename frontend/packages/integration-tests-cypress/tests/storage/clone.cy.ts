import { CLONE_NAME, CLONE_SIZE, PVCGP3 } from '../../mocks/clone';
import { PVC_NAME, PVC, testerDeploymentWithMounts } from '../../mocks/storage-common';
import { testName, checkErrors } from '../../support';
import { resourceStatusShouldContain } from '../../views/common';
import { detailsPage, DetailsPageSelector } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';

const deletePVCClone = (testNs: string, pvcName: string) => {
  cy.visit(`/k8s/ns/${testNs}/core~v1~PersistentVolumeClaim`);
  listPage.dvRows.shouldBeLoaded();
  listPage.dvFilter.byName(pvcName);
  listPage.dvRows.clickKebabAction(pvcName, 'Delete PersistentVolumeClaim');
  modal.shouldBeOpened();
  modal.submitShouldBeEnabled();
  modal.submit();
  modal.shouldBeClosed();
  listPage.dvRows.shouldNotExist(pvcName);
};

// These tests require AWS platform with EBS CSI driver for clone support
const isAws = String(Cypress.env('BRIDGE_AWS')).toLowerCase() === 'true';

if (isAws) {
  describe('Clone Tests', () => {
    before(() => {
      cy.login();
      cy.createProjectWithCLI(testName);
      cy.exec(`echo '${JSON.stringify(PVC)}' | oc apply -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(PVCGP3)}' | oc apply -n ${testName} -f -`);
      cy.exec(
        `echo '${JSON.stringify(testerDeploymentWithMounts)}' | oc apply -n ${testName} -f -`,
      );
      nav.sidenav.clickNavLink(['Storage', 'PersistentVolumeClaims']);
      listPage.dvRows.shouldBeLoaded();
      listPage.dvFilter.byName(PVC_NAME);
      resourceStatusShouldContain('Bound');
    });

    afterEach(() => {
      checkErrors();
    });

    after(() => {
      cy.exec(
        `echo '${JSON.stringify(testerDeploymentWithMounts)}' | oc delete -n ${testName} -f -`,
        {
          failOnNonZeroExit: false,
        },
      );
      cy.exec(`echo '${JSON.stringify(PVC)}' | oc delete -n ${testName} -f -`, {
        failOnNonZeroExit: false,
      });
      cy.exec(`echo '${JSON.stringify(PVCGP3)}' | oc delete -n ${testName} -f -`, {
        failOnNonZeroExit: false,
      });
      cy.deleteProjectWithCLI(testName);
    });

    it('Creates PVC Clone', () => {
      // Clean up any leftover clone from previous failed runs
      cy.exec(`oc delete pvc ${CLONE_NAME} -n ${testName} --ignore-not-found`, {
        failOnNonZeroExit: false,
      });
      // Navigate to PVC list
      cy.visit(`/k8s/ns/${testName}/core~v1~PersistentVolumeClaim`);
      listPage.dvRows.shouldBeLoaded();
      listPage.dvFilter.byName(PVC_NAME);
      listPage.dvRows.clickKebabAction(PVC_NAME, 'Clone PVC');
      modal.shouldBeOpened();
      modal.submitShouldBeEnabled();
      cy.byTestID('input-request-size').clear().type(CLONE_SIZE);
      modal.submit();
      modal.shouldBeClosed();
      cy.location('pathname').should('include', `persistentvolumeclaims/${CLONE_NAME}`);
      detailsPage.titleShouldContain(CLONE_NAME);
      // Wait for PVC to be created and details page to load
      cy.get(DetailsPageSelector.name, { timeout: 60000 }).should('contain.text', CLONE_NAME);
      cy.get(DetailsPageSelector.namespace).should('contain.text', testName);
    });

    it('Lists Clone', () => {
      cy.visit(`/k8s/ns/${testName}/core~v1~PersistentVolumeClaim`);
      listPage.dvRows.shouldBeLoaded();
      listPage.dvRows.shouldExist(CLONE_NAME);
    });

    it('Deletes PVC Clone', () => {
      deletePVCClone(testName, CLONE_NAME);
    });

    it('Creates PVC Clone with different storage class', () => {
      // Clean up any leftover clone from previous failed runs
      cy.exec(`oc delete pvc ${CLONE_NAME} -n ${testName} --ignore-not-found`, {
        failOnNonZeroExit: false,
      });
      // Navigate to PVC list and filter to find original PVC
      cy.visit(`/k8s/ns/${testName}/core~v1~PersistentVolumeClaim`);
      listPage.dvRows.shouldBeLoaded();
      listPage.dvFilter.byName(PVC_NAME);
      listPage.dvRows.clickKebabAction(PVC_NAME, 'Clone PVC');
      modal.shouldBeOpened();
      modal.submitShouldBeEnabled();
      cy.byTestID('input-request-size').clear().type(CLONE_SIZE);
      cy.byTestID('storage-class-dropdown').click();
      cy.byTestID('console-select-item').contains('gp3-csi').click();
      modal.submit();
      modal.shouldBeClosed();
      cy.location('pathname').should('include', `persistentvolumeclaims/${CLONE_NAME}`);
      detailsPage.titleShouldContain(CLONE_NAME);
      // Wait for PVC to be created and details page to load
      cy.get(DetailsPageSelector.name, { timeout: 60000 }).should('contain.text', CLONE_NAME);
      cy.get(DetailsPageSelector.namespace).should('contain.text', testName);
    });

    it('Deletes PVC Clone', () => {
      deletePVCClone(testName, CLONE_NAME);
    });
  });
} else {
  describe('Skipping Clone Tests', () => {
    it('requires AWS platform with EBS CSI driver', () => {});
  });
}
