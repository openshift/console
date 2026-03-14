import {
  VAC_1,
  VAC_2,
  VAC_INVALID_OBJ,
  VAC_NAME_1,
  VAC_NAME_2,
  VAC_INVALID,
  PVC_NAME,
  DEPLOYMENT_NAME,
  getDeployment,
} from '../../mocks/volume-attributes-class';
import { testName, checkErrors } from '../../support';
import { resourceStatusShouldContain } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { volumeAttributesClass, pvcWithVAC } from '../../views/storage/volume-attributes-class';

// These tests are meant to be run on AWS as only AWS supports CSI drivers with modifyVolume (EBS CSI)
// Normalize env check: CI env vars are strings, so "false" would be truthy without explicit comparison.
const isAws = String(Cypress.env('BRIDGE_AWS')).toLowerCase() === 'true'; // Extract into reusable logic

(isAws ? describe : describe.skip)('VolumeAttributesClass integration with PVC', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);

    // Create VACs using apply
    cy.exec(`echo '${JSON.stringify(VAC_1)}' | oc apply -f -`);
    cy.exec(`echo '${JSON.stringify(VAC_2)}' | oc apply -f -`);
    cy.exec(`echo '${JSON.stringify(VAC_INVALID_OBJ)}' | oc apply -f -`);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    // Cleanup test resources in proper order with waits to ensure complete deletion

    // Step 1: Delete Deployment (releases pod references to PVC)
    cy.exec(
      `oc delete deployment ${DEPLOYMENT_NAME} -n ${testName} --ignore-not-found=true --wait=true`,
      {
        failOnNonZeroExit: false,
        timeout: 120000,
      },
    );

    // Step 2: Delete PVC (releases PVC reference to VAC) and wait for it
    cy.exec(`oc delete pvc ${PVC_NAME} -n ${testName} --ignore-not-found=true --wait=true`, {
      failOnNonZeroExit: false,
      timeout: 120000,
    });

    // Step 3: Remove finalizers from all VACs
    [VAC_NAME_1, VAC_NAME_2, VAC_INVALID].forEach((vacName) => {
      cy.exec(
        `oc patch volumeattributesclass ${vacName} -p '{"metadata":{"finalizers":[]}}' --type=merge`,
        { failOnNonZeroExit: false, timeout: 30000 },
      );
    });

    // Step 4: Initiate VAC deletion without waiting (cluster resources can be slow to delete)
    cy.exec(
      `oc delete volumeattributesclass ${VAC_NAME_1} ${VAC_NAME_2} ${VAC_INVALID} --ignore-not-found=true --wait=false`,
      {
        failOnNonZeroExit: false,
        timeout: 30000,
      },
    );

    cy.deleteProjectWithCLI(testName);
  });

  it('creates a PVC with VolumeAttributesClass selected from the form dropdown', () => {
    pvcWithVAC.createPVCWithVAC(testName, PVC_NAME, VAC_NAME_1);
    detailsPage.titleShouldContain(PVC_NAME);
    pvcWithVAC.verifyVACOnDetailsPage(VAC_NAME_1);

    // Create Deployment to bind the PVC
    cy.exec(`echo '${JSON.stringify(getDeployment(testName, PVC_NAME))}' | oc create -f -`);

    // Wait for Deployment to be ready
    cy.exec(`oc rollout status deployment/${DEPLOYMENT_NAME} -n ${testName} --timeout=120s`, {
      failOnNonZeroExit: false,
      timeout: 130000,
    });

    // Wait for PVC to be bound (required for VAC modification to be enabled)
    pvcWithVAC.navigateToPVCDetails(testName, PVC_NAME);
    resourceStatusShouldContain('Bound', { timeout: 45000 });

    // pvcWithVAC.verifyVACOnDetailsPage(VAC_NAME_1);
  });

  it('modifies VolumeAttributesClass on PVC using the modal', () => {
    pvcWithVAC.modifyVACOnPVC(testName, PVC_NAME, VAC_NAME_2);
    pvcWithVAC.verifyVACOnDetailsPage(VAC_NAME_2);
  });

  it('handles invalid VAC gracefully by displaying requested VAC on details page', () => {
    pvcWithVAC.modifyVACOnPVC(testName, PVC_NAME, VAC_INVALID);
    pvcWithVAC.verifyVACOnDetailsPage(VAC_INVALID);

    // Navigate to VAC list page before cleanup to avoid 404 when PVC is deleted
    volumeAttributesClass.navigateToVACList();
  });
});
