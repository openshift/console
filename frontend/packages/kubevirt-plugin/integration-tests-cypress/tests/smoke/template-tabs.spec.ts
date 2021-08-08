import { testName } from '../../support';
import { tab } from '../../views/tab';
import { virtualization } from '../../views/virtualization';

const template = 'rhel6-server-small';

describe('smoke tests', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
  });

  describe('visit template list page', () => {
    it('template list page is loaded', () => {
      cy.visitVMTemplatesList();
      cy.byLegacyTestID(template).should('exist');
    });
  });

  describe('visit template tabs', () => {
    before(() => {
      cy.visitVMTemplatesList();
      cy.byLegacyTestID(template)
        .should('exist')
        .click();
    });

    it('template details tab is loaded', () => {
      cy.contains('VM Template Details').should('be.visible');
    });

    it('template yaml tab is loaded', () => {
      tab.navigateToYAML();
      cy.get('.yaml-editor').should('be.visible');
    });

    it('template network tab is loaded', () => {
      tab.navigateToNetwork();
      cy.get('button[id="add-nic"]').should('be.visible');
    });

    it('template disk tab is loaded', () => {
      tab.navigateToDisk();
      cy.get('button[id="add-disk"]').should('be.visible');
    });
  });
});
