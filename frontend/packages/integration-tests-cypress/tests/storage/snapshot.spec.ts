import { testName, checkErrors } from '../../support';
import { SnapshotDetails, dropdownFirstItem } from '../../views/storage/snapshot';
import { listPage } from '../../views/list-page';
import { PVC, testerDeployment, SnapshotClass, patchForVolume } from '../../mocks/snapshot';
import { detailsPage, DetailsPageSelector } from '../../views/details-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import { resourceStatusShouldContain } from '../../views/common';

const snapshotName = `${PVC.metadata.name}-snapshot`;

// These tests are meant to be run on AWS as only AWS supports CSI storage classes(gp2-csi)
if (Cypress.env('BRIDGE_AWS')) {
  describe('Snapshot Tests', () => {
    before(() => {
      cy.login();
      cy.createProject(testName);
      cy.exec(`echo '${JSON.stringify(PVC)}' | oc apply -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(testerDeployment)}' | oc apply -n ${testName} -f -`);
      cy.exec(`echo '${JSON.stringify(SnapshotClass)}' | oc apply -f -`);
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
      cy.exec(`oc delete pvc ${snapshotName}-restore -n ${testName}`);
      cy.exec(`echo '${JSON.stringify(SnapshotClass)}' | oc delete -f -`);
      cy.deleteProject(testName);
      cy.logout();
    });

    it('Creates Snapshot', () => {
      nav.sidenav.clickNavLink(['Volume Snapshots']);
      listPage.clickCreateYAMLbutton();
      cy.byTestID('pvc-dropdown').click();
      cy.get(dropdownFirstItem)
        .first()
        .click();
      cy.byTestID('snapshot-dropdown').click();
      cy.get(dropdownFirstItem)
        .first()
        .click();
      modal.submit();
      cy.location('pathname').should(
        'include',
        `snapshot.storage.k8s.io~v1beta1~VolumeSnapshot/${PVC.metadata.name}-snapshot`,
      );
      detailsPage.titleShouldContain(PVC.metadata.name);
      resourceStatusShouldContain('Ready', { timeout: 40000 });
      cy.exec(`oc get VolumeSnapshot ${PVC.metadata.name}-snapshot -n ${testName} -o json`)
        .its('stdout')
        .then((res) => {
          const volumeSnapshot = JSON.parse(res);
          cy.get(DetailsPageSelector.name).contains(volumeSnapshot.metadata.name);
          cy.get(DetailsPageSelector.namespace).contains(volumeSnapshot.metadata.namespace);
          cy.get(SnapshotDetails.vsc).contains(
            volumeSnapshot.status.boundVolumeSnapshotContentName,
          );
          cy.get(SnapshotDetails.sc).contains(volumeSnapshot.spec.volumeSnapshotClassName);
          cy.get(SnapshotDetails.pvc).contains(
            volumeSnapshot.spec.source.persistentVolumeClaimName,
          );
        });
    });

    it('Lists Snapshot', () => {
      nav.sidenav.clickNavLink(['Volume Snapshots']);
      listPage.rows.shouldBeLoaded();
      listPage.rows.shouldExist(snapshotName);
      listPage.rows.shouldNotExist(`${snapshotName}dup`);
    });

    it('Restore a Snapshot to create a new claim from it', () => {
      cy.clickNavLink(['Volume Snapshots']);
      listPage.rows.clickKebabAction(snapshotName, 'Restore as new PVC');
      modal.shouldBeOpened();
      cy.byTestID('pvc-name').should('have.value', `${snapshotName}-restore`);
      cy.get(SnapshotDetails.scDropdown).click();
      cy.get(dropdownFirstItem)
        .eq(1)
        .click();
      modal.submit();
      modal.shouldBeClosed();
      cy.exec(
        `oc patch Deployment ${
          testerDeployment.metadata.name
        } --type='json' -n ${testName} -p '[${JSON.stringify(patchForVolume)}]'`,
      )
        .its('stdout')
        .then(() => resourceStatusShouldContain('Bound', { timeout: 40000 }));
    });

    it('Deletes Snapshot', () => {
      cy.clickNavLink(['Volume Snapshots']);
      listPage.rows.clickKebabAction(snapshotName, 'Delete Volume Snapshot');
      modal.shouldBeOpened();
      modal.submitShouldBeEnabled();
      modal.submit();
      modal.shouldBeClosed();
      listPage.rows.shouldNotExist(snapshotName);
    });
  });
} else {
  describe('Skipping Snapshot Tests', () => {
    it('No CSI based storage classes are available in this platform', () => {});
  });
}
