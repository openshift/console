export const clusterSettings = {
  detailsIsLoaded: () => {
    cy.visit('/settings/cluster');
    cy.byLegacyTestID('horizontal-link-Details').should('exist'); // wait for page to load
  },
  pauseMCP: (value: 'true' | 'false' = 'true') => {
    cy.exec(
      `oc patch machineconfigpools worker --patch '{ "spec": { "paused": ${value} } }' --type=merge`,
    );
  },
  openUpdateModalAndOpenDropdown: () => {
    cy.byLegacyTestID('cv-update-button').should('exist').click();
    cy.byLegacyTestID('modal-title').should('contain.text', 'Update cluster');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-toggle"]')
      .should('exist')
      .click();
  },
};
