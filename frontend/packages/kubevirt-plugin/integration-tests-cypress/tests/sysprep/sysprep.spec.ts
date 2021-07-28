import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';

const vmName = `${testName}-vm-advanced-wizard`;

describe('ID (CNV-6821) Sysprep testing', () => {
  before(() => {
    cy.Login();
    cy.visit('');
    cy.createProject(testName);
  });

  it('should navigate to advanced wizard - advanced tab', () => {
    cy.get('[data-test=nav]')
      .filter('[href$=virtualization]')
      .then((link) => cy.visit(link.attr('href')));
    cy.byLegacyTestID('item-create').click();
    cy.byLegacyTestID('vm-wizard').click();
    cy.get('.kv-select-template__tile')
      .find(':contains("Windows")')
      .eq(1)
      .click();
    cy.byLegacyTestID('wizard-next')
      .as('nextButton')
      .click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-test-id="modal-title"]').length) {
        cy.get('[id=confirm-action]').click();
      }
    });
    cy.get('[id=image-source-type-dropdown]').click();
    cy.contains('Import via Registry (creates PVC)').click();
    cy.get('[id=provision-source-container').type(ProvisionSource.REGISTRY.getSource());
    cy.get('@nextButton').click();
    cy.get('[id=vm-name]')
      .clear()
      .type(vmName);
    cy.byLegacyTestID('wizard-customize').click();
    cy.get('.pf-c-wizard__nav-link')
      .filter(':contains("Advanced")')
      .click();
  });

  it('should check sysprep upload fields are present', () => {
    cy.get('.pf-c-file-upload').should('have.lengthOf', 2);
  });

  it('should fill input fields with data and create vm', () => {
    cy.fixture('sysprep.xml').then((sysprep) => {
      cy.get('[id="sysprep-Autounattend.xml-input"]').type(sysprep);
      cy.get('[id="sysprep-Unattend.xml-input"]').type(sysprep);
    });
    cy.get('[id=create-vm-wizard-submit-btn]')
      .click()
      .click();
    cy.byLegacyTestID('kubevirt-wizard-success-result').should('be.visible');
  });

  it('should check for added sysprep disk', () => {
    cy.get('.pf-c-button.pf-m-primary')
      .filter(':contains("virtual machine")')
      .click();
    cy.byLegacyTestID('horizontal-link-Disks').click();
    cy.get('[data-id=sysprep').should('be.visible');
  });

  it('should check sysprep configmap is present', () => {
    cy.get('.pf-c-nav__link.pf-c-nav__link')
      .filter(':contains("ConfigMaps")')
      .click();
    cy.byLegacyTestID(`sysprep-config-${vmName}`).should('be.visible');
  });

  after(() => {
    cy.deleteProject(testName);
    cy.visit('');
  });
});
