export default ({ vmName }) =>
  describe('ID (CNV-5986) Test if ssh service is present', () => {
    it('should navigate to services', () => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000);
      cy.get('[data-test=nav]')
        .filter('[href$=services]')
        .then((link) => cy.visit(link.attr('href')));
    });

    it('checking vm ssh service is present and port is 22', () => {
      cy.byLegacyTestID(`${vmName}-ssh-service`).click();
      cy.get('.co-text-pod').within(() => {
        cy.contains('22').should('have.text', 22);
      });
    });
  });
