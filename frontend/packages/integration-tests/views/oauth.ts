const idpNameInput = '#idp-name';
const oauthSettingsURL = '/k8s/cluster/config.openshift.io~v1~OAuth/cluster';

export const oauth = {
  idpSetup: (idpName: string, idpID: string) => {
    cy.visit(oauthSettingsURL);
    cy.byLegacyTestID('dropdown-button').click();
    cy.byLegacyTestID(idpID).click();
    cy.get(idpNameInput).clear();
    cy.get(idpNameInput).type(idpName);
  },
  idpSaveAndVerify: (idpName: string, idpType: string) => {
    cy.byLegacyTestID('add-idp').click();
    cy.byTestID('alert-error').should('not.exist');
    cy.url().should('include', oauthSettingsURL);
    cy.get(`[data-test-idp-name="${idpName}"]`).should('have.text', idpName);
    cy.get(`[data-test-idp-type-for="${idpName}"]`).should('have.text', idpType);
    cy.get(`[data-test-idp-mapping-for="${idpName}"]`).should('have.text', 'claim');
  },
};
