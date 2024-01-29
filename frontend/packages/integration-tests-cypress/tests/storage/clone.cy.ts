import { PVC, PVCGP3, testerDeployment } from '../../mocks/snapshot';
import { testName, checkErrors } from '../../support';
import { resourceStatusShouldContain } from '../../views/common';
import { detailsPage, DetailsPageSelector } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';

const cloneName = `${PVC.metadata.name}-clone`;
const cloneSize = '2';
const deletePVCClone = (pvcName: string) => {
  nav.sidenav.clickNavLink(['PersistentVolumeClaims']);
  listPage.filter.byName(pvcName);
  listPage.rows.clickKebabAction(pvcName, 'Delete PersistentVolumeClaim');
  modal.shouldBeOpened();
  modal.submitShouldBeEnabled();
  modal.submit();
  modal.shouldBeClosed();
  listPage.rows.shouldNotExist(pvcName);
};

if (Cypress.env('BRIDGE_AWS')) {
  describe('Clone Tests', () => {
    before(() => {
      cy.login();
      cy.createProjectWithCLI(testName);
      cy.exec(`echo '${JSON.stringify(PVC)}' | oc apply -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(PVCGP3)}' | oc apply -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(testerDeployment)}' | oc apply -n ${testName} -f -`);
      nav.sidenav.clickNavLink(['Storage', 'PersistentVolumeClaims']);
      listPage.filter.byName(PVC.metadata.name);
      resourceStatusShouldContain('Bound');
    });

    afterEach(() => {
      checkErrors();
    });

    after(() => {
      cy.exec(`echo '${JSON.stringify(testerDeployment)}' | oc delete -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(PVC)}' | oc delete -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(PVCGP3)}' | oc delete -n ${testName} -f -`);
      cy.deleteProjectWithCLI(testName);
    });

    it('Creates PVC Clone', () => {
      listPage.rows.clickKebabAction(PVC.metadata.name, 'Clone PVC');
      modal.shouldBeOpened();
      modal.submitShouldBeEnabled();
      cy.byTestID('input-request-size').clear().type(cloneSize);
      modal.submit();
      modal.shouldBeClosed();
      cy.location('pathname').should(
        'include',
        `persistentvolumeclaims/${PVC.metadata.name}-clone`,
      );
      detailsPage.titleShouldContain(`${PVC.metadata.name}-clone`);
      cy.exec(`oc get pvc ${PVC.metadata.name}-clone -n ${testName} -o json`)
        .its('stdout')
        .then((res) => {
          const pvc = JSON.parse(res);
          cy.get(DetailsPageSelector.name).contains(pvc.metadata.name);
          cy.get(DetailsPageSelector.namespace).contains(pvc.metadata.namespace);
          cy.byTestID('pvc-requested-capacity').contains(`${cloneSize} GiB`);
        });
    });

    it('Lists Clone', () => {
      nav.sidenav.clickNavLink(['PersistentVolumeClaims']);
      listPage.rows.shouldBeLoaded();
      listPage.rows.shouldExist(cloneName);
    });

    it('Deletes PVC Clone', () => {
      deletePVCClone(cloneName);
    });

    it('Creates PVC Clone with different storage cluster', () => {
      listPage.filter.byName(PVC.metadata.name);
      listPage.rows.clickKebabAction(PVC.metadata.name, 'Clone PVC');
      modal.shouldBeOpened();
      modal.submitShouldBeEnabled();
      cy.byTestID('input-request-size').clear().type(cloneSize);
      cy.byTestID('storage-class-dropdown').click();
      cy.byTestID('dropdown-menu-item-link').contains('gp3-csi').click();
      modal.submit();
      modal.shouldBeClosed();
      cy.location('pathname').should(
        'include',
        `persistentvolumeclaims/${PVC.metadata.name}-clone`,
      );
      detailsPage.titleShouldContain(`${PVC.metadata.name}-clone`);
      cy.exec(`oc get pvc ${PVC.metadata.name}-clone -n ${testName} -o json`)
        .its('stdout')
        .then((res) => {
          const pvc = JSON.parse(res);
          cy.get(DetailsPageSelector.name).contains(pvc.metadata.name);
          cy.get(DetailsPageSelector.namespace).contains(pvc.metadata.namespace);
          cy.byTestID('pvc-requested-capacity').contains(`${cloneSize} GiB`);
        });
    });

    it('Deletes PVC Clone', () => {
      deletePVCClone(cloneName);
    });
  });
} else {
  describe('Skipping Clone Tests', () => {
    it('No CSI based storage classes are available in this platform', () => {});
  });
}
