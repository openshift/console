export {}; // needed in files which don't have an import to trigger ES6 module usage
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare
  namespace Cypress {
    interface Chainable<Subject> {
      byNodeName(nodeName: string): Chainable<Element>;
      byAppGroupName(appName: string): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('byNodeName', (nodeName: string) => {
    cy.get('g.odc-resource-icon').next('text').contains(nodeName);
  });

Cypress.Commands.add('byAppGroupName', (appName: string) => {
    cy.get(`[data-id="group:${appName}"] g.odc-application-group__label text`)
});
