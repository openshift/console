import { testName } from '../../support';
import { virtualization } from '../../views/virtualization';

const template = 'rhel6-server-small';

describe('smoke tests', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  describe('visit template list page', () => {
    it('template list page is loaded', () => {
      virtualization.templates.visit();
      cy.byLegacyTestID(template).should('exist');
    });
  });

  describe('visit template tabs', () => {
    before(() => {
      cy.byLegacyTestID(template)
        .should('exist')
        .click();
    });

    it('template details tab is loaded', () => {
      cy.contains('VM Template Details').should('be.visible');
    });

    it('template yaml tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-public~YAML').click();
      cy.get('.yaml-editor').should('be.visible');
    });

    it('template network tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Network Interfaces').click();
      cy.get('button[id="add-nic"]').should('be.visible');
    });

    it('template disk tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Disks').click();
      cy.get('button[id="add-disk"]').should('be.visible');
    });
  });
});
