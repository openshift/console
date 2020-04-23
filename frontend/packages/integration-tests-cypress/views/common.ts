export const resourceStatusShouldContain = (desiredStatus: string, options?: any) =>
  cy.contains('[data-test="status-text"]', desiredStatus, options);

export const isLoaded = (id: string) => cy.byTestID(id).should('exist');
