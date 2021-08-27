import vmiFixture from '../../fixtures/vmi-ephemeral';
import { testName } from '../../support';
import { virtualization } from '../../views/virtualization';

const vmiName = 'vmi-ephemeral';

describe('smoke tests', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    vmiFixture.metadata.namespace = testName;
    cy.createResource(vmiFixture);
  });

  after(() => {
    cy.deleteResource({
      kind: 'VirtualMachineInstance',
      metadata: {
        name: vmiName,
        namespace: testName,
      },
    });
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  describe('visit vmi list page', () => {
    it('vmi list page is loaded', () => {
      virtualization.vms.visit();
      cy.byLegacyTestID(vmiName).should('exist');
    });
  });

  describe('visit vmi tabs', () => {
    before(() => {
      cy.byLegacyTestID(vmiName)
        .should('exist')
        .click();
    });

    it('vmi overview tab is loaded', () => {
      cy.get('.co-dashboard-card__title').should('exist');
    });

    it('vmi details tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Details').click();
      cy.contains('Virtual Machine Instance Details').should('be.visible');
    });

    it('vmi yaml tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-public~YAML').click();
      cy.get('.yaml-editor').should('be.visible');
    });

    it('vmi events tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-public~Events').click();
      cy.get('.co-sysevent-stream').should('be.visible');
    });

    it('vmi console tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Console').click();
      cy.get('.loading-box__loaded').should('be.visible');
    });

    it('vmi network tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Network Interfaces').click();
      cy.get('.loading-box__loaded').should('be.visible');
    });

    it('vmi disk tab is loaded', () => {
      cy.byLegacyTestID('horizontal-link-Disks').click();
      cy.get('.loading-box__loaded').should('be.visible');
    });
  });
});
