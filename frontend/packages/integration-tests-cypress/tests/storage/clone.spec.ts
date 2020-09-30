import { testName, checkErrors } from '../../support';
import { listPage } from '../../views/list-page';
import { PVC, testerDeployment } from '../../mocks/snapshot';
import { detailsPage, DetailsPageSelector } from '../../views/details-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import { resourceStatusShouldContain } from '../../views/common';

const cloneName = `${PVC.metadata.name}-clone`;
const cloneSize = '2';

if (Cypress.env('BRIDGE_AWS')) {
  describe('Clone Tests', () => {
    before(() => {
      cy.login();
      cy.createProject(testName);
      cy.exec(`echo '${JSON.stringify(PVC)}' | oc apply -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(testerDeployment)}' | oc apply -n ${testName} -f -`);
      nav.sidenav.clickNavLink(['Storage', 'Persistent Volume Claims']);
      listPage.filter.byName(PVC.metadata.name);
      resourceStatusShouldContain('Bound');
    });

    afterEach(() => {
      checkErrors();
    });

    after(() => {
      cy.exec(`echo '${JSON.stringify(testerDeployment)}' | oc delete -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(PVC)}' | oc delete -n ${testName} -f -`);
      cy.deleteProject(testName);
      cy.logout();
    });

    it('Creates PVC Clone', () => {
      listPage.rows.clickKebabAction(PVC.metadata.name, 'Clone PVC');
      modal.shouldBeOpened();
      modal.submitShouldBeEnabled();
      cy.byTestID('input-request-size')
        .clear()
        .type(cloneSize);
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
      nav.sidenav.clickNavLink(['Persistent Volume Claims']);
      listPage.rows.shouldBeLoaded();
      listPage.rows.shouldExist(cloneName);
    });

    it('Deletes PVC Clone', () => {
      listPage.filter.byName(cloneName);
      listPage.rows.clickKebabAction(cloneName, 'Delete Persistent Volume Claim');
      modal.shouldBeOpened();
      modal.submitShouldBeEnabled();
      modal.submit();
      modal.shouldBeClosed();
      listPage.rows.shouldNotExist(cloneName);
    });
  });
} else {
  describe('Skipping Clone Tests', () => {
    it('No CSI based storage classes are available in this platform', () => {});
  });
}
