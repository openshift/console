describe('Virtualization status on Overview page', () => {
  before(() => {
    cy.Login();
  });

  it('ID(CNV-7507) Test Virtualization status on Overview page', () => {
    cy.clickNavLink(['Home', 'Overview']);
    cy.get('[data-item-id="Virtualization-health-item"]').then(($item) => {
      cy.wrap($item)
        .get('svg[data-test="success-icon"]')
        .should('exist');
      cy.wrap($item)
        .get('title')
        .contains('Healthy')
        .should('exist');
    });
  });
});
