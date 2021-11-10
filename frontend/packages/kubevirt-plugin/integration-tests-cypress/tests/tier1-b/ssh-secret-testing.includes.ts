import sshFixure from '../../fixtures/ssh';

export default () =>
  describe('ID (CNV-5985) Test if ssh secret is present', () => {
    beforeEach(() => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000);
      cy.get('[data-test=nav]')
        .filter('[href$=secrets]')
        .then((link) => cy.visit(link.attr('href')));
    });

    it('check vm ssh secret is present and equal to key', () => {
      cy.contains(`authorizedsshkeys-`).click();
      cy.contains('Reveal values').click();
      cy.byTestID('copy-to-clipboard')
        .invoke('text')
        .should('eq', sshFixure.key);
    });

    it('check project ssh secret is present and equal to key', () => {
      cy.byLegacyTestID('authorizedsshkeys').click();
      cy.contains('Reveal values').click();
      cy.byTestID('copy-to-clipboard')
        .invoke('text')
        .should('eq', sshFixure.key);
    });
  });
