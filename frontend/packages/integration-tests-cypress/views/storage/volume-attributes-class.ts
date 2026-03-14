import { detailsPage } from '../details-page';
import { listPage } from '../list-page';
import { modal } from '../modal';

export const volumeAttributesClass = {
  navigateToVACList: () => {
    cy.visit('/k8s/cluster/storage.k8s.io~v1~VolumeAttributesClass');
    listPage.dvRows.shouldBeLoaded();
  },
};

export const pvcWithVAC = {
  createPVCWithVAC: (namespace: string, pvcName: string, vacName: string) => {
    cy.visit(`/k8s/ns/${namespace}/persistentvolumeclaims/~new/form`);

    // Wait for form to be fully loaded
    cy.byTestID('pvc-name', { timeout: 30000 }).should('be.visible');

    // Wait for VAC dropdown to load and select VAC
    cy.byTestID('volumeattributesclass-dropdown', { timeout: 30000 }).should('be.visible').click();
    cy.byTestID('console-select-item').contains(vacName).click();

    // Fill PVC name
    cy.byTestID('pvc-name').clear().type(pvcName);

    // Set size
    cy.byTestID('pvc-size').clear().type('1');

    // Create PVC
    cy.byTestID('create-pvc').click();

    // Wait for navigation to details page
    cy.location('pathname', { timeout: 30000 }).should(
      'include',
      `persistentvolumeclaims/${pvcName}`,
    );
    detailsPage.isLoaded();
  },

  navigateToPVCDetails: (namespace: string, pvcName: string) => {
    cy.visit(`/k8s/ns/${namespace}/persistentvolumeclaims/${pvcName}`);
    detailsPage.isLoaded();
  },

  modifyVACOnPVC: (namespace: string, pvcName: string, newVACName: string) => {
    pvcWithVAC.navigateToPVCDetails(namespace, pvcName);

    // Open actions menu and wait for Modify VAC action to be enabled (not disabled)
    cy.byLegacyTestID('actions-menu-button').click();
    cy.byTestActionID('Modify VolumeAttributesClass')
      .should('be.visible')
      .and('not.have.attr', 'aria-disabled', 'true')
      .click();

    modal.shouldBeOpened();
    modal.modalTitleShouldContain('Modify VolumeAttributesClass');

    // Wait for and click the VAC dropdown in the modal
    cy.byTestID('modify-vac-dropdown', { timeout: 15000 }).should('be.visible').click();
    cy.byTestID('console-select-item').contains(newVACName).click();

    modal.submit();
    modal.shouldBeClosed();
  },

  verifyVACOnDetailsPage: (vacName: string) => {
    cy.get('[data-test-section-heading="PersistentVolumeClaim details"]')
      .parent()
      .contains(vacName)
      .should('be.visible');
  },
};
