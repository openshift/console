// Not in ssh.spec until this is fixed: https://github.com/cypress-io/eslint-plugin-cypress/issues/43
const AFTER_CREATE_WAIT_TIME = 3000;

export default ({ vmName }) =>
  describe('ID (CNV-5985) Test if ssh secret is present', () => {
    beforeEach(() => {
      // eslint-disable-next-line
      cy.wait(AFTER_CREATE_WAIT_TIME);
      cy.get('[data-test=nav]')
        .filter('[href$=secrets]')
        .then((link) => cy.visit(link.attr('href')));
    });

    it('check vm ssh secret is present and equal to key', () => {
      cy.byLegacyTestID(`authorizedsshkeys-${vmName}`).click();
      cy.contains('Reveal values').click();
      cy.byTestID('copy-to-clipboard')
        .invoke('text')
        .then((val) => {
          cy.fixture('ssh')
            .its('key')
            .should('eq', val);
        });
    });

    it('check project ssh secret is present and equal to key', () => {
      cy.byLegacyTestID('authorizedsshkeys').click();
      cy.contains('Reveal values').click();
      cy.byTestID('copy-to-clipboard')
        .invoke('text')
        .then((val) => {
          console.log('val: ', val);
          cy.fixture('ssh')
            .its('key')
            .should('eq', val);
        });
    });
  });
