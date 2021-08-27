export enum Perspective {
  Developer = 'Developer Perspective',
  Administrator = ' Administrator Perspective',
}

export const addHeader = '+Add-header';
export const topologyHeader = 'topology-header';
export const tour = '[data-test="tour-step-footer-secondary"]';

export const switchPerspective = (perspective: Perspective) => {
  cy.byLegacyTestID('perspective-switcher-toggle').click();
  cy.byLegacyTestID('perspective-switcher-menu').should('be.visible');
  switch (perspective) {
    case Perspective.Developer:
      cy.get('.pf-c-dropdown__menu-item')
        .contains('Developer')
        .click();
      // skip tour
      cy.get('body').then(($body) => {
        if ($body.find(tour).length) {
          cy.get(tour).click();
        }
      });
      break;
    case Perspective.Administrator:
      cy.get('.pf-c-dropdown__menu-item')
        .contains('Administrator')
        .click();
      // skip tour
      cy.get('body').then(($body) => {
        if ($body.find(tour).length) {
          cy.get(tour).click();
        }
      });
      break;
    default:
      throw new Error('Perspective is not valid');
  }
};
