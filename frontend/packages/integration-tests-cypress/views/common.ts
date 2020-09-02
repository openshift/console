export const resourceStatusShouldContain = (desiredStatus: string) =>
  cy.contains('[data-test="status-text"]', desiredStatus);
