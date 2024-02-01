export const isLoaded = () => cy.get(`[data-test=resource-sidebar]`).should('exist');
export const isSampleListLoaded = () => cy.get(`[data-test=resource-samples-list]`).should('exist');

export const selectTab = (name: string) => {
  cy.get(`[data-test-id="horizontal-link-${name}"]`).should('exist').click();
};

export const loadFirstSample = () => {
  cy.get('[data-test="load-sample"]').first().click();
};
