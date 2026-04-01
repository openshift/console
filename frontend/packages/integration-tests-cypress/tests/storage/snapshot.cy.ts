import { SNAPSHOT_NAME, SnapshotClass, patchForVolume } from '../../mocks/snapshot';
import {
  PVC_NAME,
  DEPLOYMENT_NAME,
  PVC,
  testerDeploymentWithMounts,
} from '../../mocks/storage-common';
import { testName, checkErrors } from '../../support';
import { resourceStatusShouldContain } from '../../views/common';
import { detailsPage, DetailsPageSelector } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import { SnapshotDetails, dropdownFirstItem } from '../../views/storage/snapshot';

// These tests require AWS platform with EBS CSI driver for snapshot support
const isAws = String(Cypress.env('BRIDGE_AWS')).toLowerCase() === 'true';

if (isAws) {
  describe('Snapshot Tests', () => {
    before(() => {
      cy.login();
      cy.createProjectWithCLI(testName);
      cy.exec(`echo '${JSON.stringify(PVC)}' | oc apply -n ${testName} -f -`);
      cy.exec(
        `echo '${JSON.stringify(testerDeploymentWithMounts)}' | oc apply -n ${testName} -f -`,
      );
      cy.exec(`echo '${JSON.stringify(SnapshotClass)}' | oc apply -f -`);
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
      cy.exec(`oc delete pvc ${SNAPSHOT_NAME}-restore -n ${testName} --ignore-not-found`, {
        failOnNonZeroExit: false,
      });
      cy.exec(`echo '${JSON.stringify(SnapshotClass)}' | oc delete -f -`, {
        failOnNonZeroExit: false,
      });
      cy.deleteProjectWithCLI(testName);
    });

    it('Creates Snapshot', () => {
      // Navigate directly to snapshot creation form in the correct namespace
      cy.visit(`/k8s/ns/${testName}/volumesnapshots/~new/form`);
      // Wait for PVC dropdown to be ready and select PVC
      cy.byTestID('pvc-dropdown', { timeout: 60000 }).should('be.visible').click();
      cy.get(dropdownFirstItem, { timeout: 60000 }).should('be.visible').first().click();
      // Wait for snapshot class dropdown to be ready and select snapshot class
      cy.byTestID('snapshot-dropdown', { timeout: 60000 }).should('be.visible').click();
      cy.get(dropdownFirstItem, { timeout: 60000 }).should('be.visible').first().click();
      cy.get('#save-changes').click();
      cy.location('pathname').should(
        'include',
        `snapshot.storage.k8s.io~v1~VolumeSnapshot/${SNAPSHOT_NAME}`,
      );
      detailsPage.titleShouldContain(SNAPSHOT_NAME);
      // Verify snapshot details - don't wait for Ready status here as it can take 1-2 minutes
      // The restore test will implicitly verify the snapshot is usable
      cy.get(DetailsPageSelector.name, { timeout: 60000 }).should('contain.text', SNAPSHOT_NAME);
      cy.get(DetailsPageSelector.namespace, { timeout: 30000 }).should('contain.text', testName);
    });

    it('Lists Snapshot', () => {
      cy.visit(`/k8s/ns/${testName}/snapshot.storage.k8s.io~v1~VolumeSnapshot`);
      listPage.dvRows.shouldBeLoaded();
      listPage.dvRows.shouldExist(SNAPSHOT_NAME);
    });

    it('Restores Snapshot to create a new PVC', () => {
      // Navigate to snapshot details and wait for Ready status before restoring
      cy.visit(`/k8s/ns/${testName}/snapshot.storage.k8s.io~v1~VolumeSnapshot/${SNAPSHOT_NAME}`);
      resourceStatusShouldContain('Ready', { timeout: 120000 });
      // Now navigate to list and restore
      cy.visit(`/k8s/ns/${testName}/snapshot.storage.k8s.io~v1~VolumeSnapshot`);
      listPage.dvRows.shouldBeLoaded();
      listPage.dvRows.clickKebabAction(SNAPSHOT_NAME, 'Restore as new PVC');
      modal.shouldBeOpened();
      cy.byTestID('pvc-name').should('have.value', `${SNAPSHOT_NAME}-restore`);
      cy.get(SnapshotDetails.scDropdown).click();
      cy.get(dropdownFirstItem).eq(1).click();
      modal.submit();
      modal.shouldBeClosed();
      // Patch deployment to consume restored PVC, triggering Bound status
      cy.exec(
        `oc patch Deployment ${DEPLOYMENT_NAME} --type='json' -n ${testName} -p '[${JSON.stringify(
          patchForVolume,
        )}]'`,
      )
        .its('stdout')
        .then(() => resourceStatusShouldContain('Bound', { timeout: 60000 }));
    });

    it('Deletes Snapshot', () => {
      cy.visit(`/k8s/ns/${testName}/snapshot.storage.k8s.io~v1~VolumeSnapshot`);
      listPage.dvRows.shouldBeLoaded();
      listPage.dvRows.clickKebabAction(SNAPSHOT_NAME, 'Delete VolumeSnapshot');
      modal.shouldBeOpened();
      modal.submitShouldBeEnabled();
      modal.submit();
      modal.shouldBeClosed();
      listPage.dvRows.shouldNotExist(SNAPSHOT_NAME);
    });
  });
} else {
  describe('Skipping Snapshot Tests', () => {
    it('requires AWS platform with EBS CSI driver', () => {});
  });
}
