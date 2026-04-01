import { getVACFixtures } from '../../mocks/volume-attributes-class';
import { testName, checkErrors } from '../../support';
import { resourceStatusShouldContain } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';

// These tests require AWS platform with EBS CSI driver for modifyVolume support
const isAws = String(Cypress.env('BRIDGE_AWS')).toLowerCase() === 'true';

if (isAws) {
  describe('VolumeAttributesClass E2E tests', () => {
    // Generate unique fixtures per test run to avoid collisions on shared clusters
    const fixtures = getVACFixtures(testName);
    const {
      VAC_LOW_IOPS,
      VAC_HIGH_IOPS,
      VAC_INVALID,
      STORAGE_CLASS,
      TEST_VAC_LOW_IOPS,
      TEST_VAC_HIGH_IOPS,
      TEST_VAC_INVALID,
      TEST_PVC,
      TEST_DEPLOYMENT,
      TEST_STORAGECLASS,
      getDeployment,
    } = fixtures;

    before(() => {
      cy.login();
      cy.createProjectWithCLI(testName);
      // Create StorageClass for PVC provisioning
      cy.exec(`echo '${JSON.stringify(STORAGE_CLASS)}' | oc apply -f -`);
      // Create VolumeAttributesClasses for testing
      cy.exec(`echo '${JSON.stringify(VAC_LOW_IOPS)}' | oc apply -f -`);
      cy.exec(`echo '${JSON.stringify(VAC_HIGH_IOPS)}' | oc apply -f -`);
      cy.exec(`echo '${JSON.stringify(VAC_INVALID)}' | oc apply -f -`);
      // Create Deployment that will consume the PVC
      cy.exec(`echo '${JSON.stringify(getDeployment(testName, TEST_PVC))}' | oc apply -f -`);
    });

    afterEach(() => {
      checkErrors();
    });

    after(() => {
      // Navigate to VAC list page to avoid 404 during cleanup
      cy.visit('/k8s/cluster/storage.k8s.io~v1~VolumeAttributesClass');
      listPage.dvRows.shouldBeLoaded();

      // Delete Deployment first to release PVC
      cy.exec(
        `oc delete deployment ${TEST_DEPLOYMENT} -n ${testName} --ignore-not-found=true --wait=true`,
        {
          failOnNonZeroExit: false,
          timeout: 120000,
        },
      );

      // Delete PVC to release VAC reference
      cy.exec(`oc delete pvc ${TEST_PVC} -n ${testName} --ignore-not-found=true --wait=true`, {
        failOnNonZeroExit: false,
        timeout: 120000,
      });

      // Remove finalizers from VACs to allow deletion
      [TEST_VAC_LOW_IOPS, TEST_VAC_HIGH_IOPS, TEST_VAC_INVALID].forEach((vacName) => {
        cy.exec(
          `oc patch volumeattributesclass ${vacName} -p '{"metadata":{"finalizers":[]}}' --type=merge`,
          { failOnNonZeroExit: false, timeout: 30000 },
        );
      });

      // Delete VACs without waiting (cluster-scoped resources can be slow)
      cy.exec(
        `oc delete volumeattributesclass ${TEST_VAC_LOW_IOPS} ${TEST_VAC_HIGH_IOPS} ${TEST_VAC_INVALID} --ignore-not-found=true --wait=false`,
        {
          failOnNonZeroExit: false,
          timeout: 30000,
        },
      );

      // Delete StorageClass
      cy.exec(`oc delete storageclass ${TEST_STORAGECLASS} --ignore-not-found=true --wait=false`, {
        failOnNonZeroExit: false,
        timeout: 30000,
      });

      cy.deleteProjectWithCLI(testName);
    });

    it('creates PVC with VolumeAttributesClass and verifies it appears on details page', () => {
      cy.visit(`/k8s/ns/${testName}/persistentvolumeclaims/~new/form`);
      cy.byTestID('pvc-name').should('exist').clear().type(TEST_PVC);
      cy.byTestID('pvc-size').clear().type('1');

      // Select StorageClass from dropdown
      cy.byTestID('storageclass-dropdown').click();
      cy.byTestID('console-select-item').contains(TEST_STORAGECLASS).click();

      // Select VolumeAttributesClass from dropdown
      cy.byTestID('volumeattributesclass-dropdown').click();
      cy.byTestID('console-select-item').contains(TEST_VAC_LOW_IOPS).click();

      // Create PVC and navigate to details page
      cy.byTestID('create-pvc').click();
      detailsPage.titleShouldContain(TEST_PVC);

      // Verify requested VAC is displayed
      cy.byLegacyTestID('pvc-requested-vac', { timeout: 30000 }).should(
        'contain.text',
        TEST_VAC_LOW_IOPS,
      );

      // Wait for PVC to reach Bound status
      resourceStatusShouldContain('Bound', { timeout: 120000 });

      // Verify current VAC matches requested VAC
      cy.byLegacyTestID('pvc-current-vac', { timeout: 30000 }).should('exist');
      cy.byLegacyTestID('pvc-current-vac').should('contain.text', TEST_VAC_LOW_IOPS);
    });

    it('modifies VolumeAttributesClass via modal and verifies update', () => {
      cy.visit(`/k8s/ns/${testName}/persistentvolumeclaims/${TEST_PVC}`);
      detailsPage.isLoaded();

      // Open Modify VolumeAttributesClass modal
      detailsPage.clickPageActionFromDropdown('Modify VolumeAttributesClass');
      modal.shouldBeOpened();

      // Select new VolumeAttributesClass
      cy.byTestID('modify-vac-dropdown').click();
      cy.byTestID('console-select-item').contains(TEST_VAC_HIGH_IOPS).click();
      modal.submit();
      modal.shouldBeClosed();

      // Verify requested VAC updated to new value
      cy.byLegacyTestID('pvc-requested-vac', { timeout: 30000 }).should(
        'contain.text',
        TEST_VAC_HIGH_IOPS,
      );

      // Verify current VAC updated to new value
      cy.byLegacyTestID('pvc-current-vac', { timeout: 30000 }).should(
        'contain.text',
        TEST_VAC_HIGH_IOPS,
      );
    });

    it('attempts invalid VAC modification and verifies error alert', () => {
      cy.visit(`/k8s/ns/${testName}/persistentvolumeclaims/${TEST_PVC}`);
      detailsPage.isLoaded();

      // Open Modify VolumeAttributesClass modal and select invalid VAC
      detailsPage.clickPageActionFromDropdown('Modify VolumeAttributesClass');
      modal.shouldBeOpened();
      cy.byTestID('modify-vac-dropdown').click();
      cy.byTestID('console-select-item').contains(TEST_VAC_INVALID).click();
      modal.submit();
      modal.shouldBeClosed();

      // Verify requested VAC updated to invalid value
      cy.byLegacyTestID('pvc-requested-vac', { timeout: 30000 }).should(
        'contain.text',
        TEST_VAC_INVALID,
      );

      // Verify current VAC remains at previous valid value
      cy.byLegacyTestID('pvc-current-vac').should('exist');
      cy.byLegacyTestID('pvc-current-vac').should('contain.text', TEST_VAC_HIGH_IOPS);

      // Verify error alert appears after CSI driver rejects modification
      cy.byLegacyTestID('vac-error-alert', { timeout: 60000 }).should('be.visible');
      cy.byLegacyTestID('vac-error-alert').should(
        'contain.text',
        'VolumeAttributesClass modification failed',
      );
    });
  });
} else {
  describe('Skipping VolumeAttributesClass Tests', () => {
    it('requires AWS platform with EBS CSI driver', () => {});
  });
}
