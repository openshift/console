export const nameID = '#network-attachment-definition-name';
export const type = '#network-type';
export const cnvBridgeLink = '[data-test-dropdown-menu="cnv-bridge"]';
export const bridgeName = '#network-type-params-bridge-text';
export const row = '[data-test-rows="resource-row"]';
export const kebabBtn = '[data-test-id="kebab-button"]';
export const deleteAction = '[data-test-action="Delete Network Attachment Definition"]';
export const confirmBtn = '[data-test="confirm-action"]';
export const heading = '[data-test-section-heading="NetworkAttachmentDefinition details"]';
export const createBtn = '#save-changes';
export const macSpoofCHK = '#network-type-params-macspoofchk-checkbox';

export const createNAD = (name: string, bridge: string, uncheckmacspoof?: boolean) => {
  cy.byTestID('item-create').click();
  cy.get(nameID)
    .type(name)
    .should('have.value', name);
  cy.get(type).click();
  cy.get(cnvBridgeLink).click();
  cy.get(bridgeName).type(bridge);
  if (uncheckmacspoof) {
    cy.get(macSpoofCHK).click();
  }
  cy.get(createBtn).click();
  cy.get(heading).should('exist');
};

export const deleteNAD = (name: string) => {
  cy.contains(row, name)
    .find(kebabBtn)
    .click();
  cy.get(deleteAction).click();
  cy.get(confirmBtn).click();
  cy.contains(row, name).should('not.exist');
};
