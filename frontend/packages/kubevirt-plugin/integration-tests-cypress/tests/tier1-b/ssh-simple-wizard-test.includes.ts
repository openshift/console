import sshFixure from '../../fixtures/ssh';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { virtualization } from '../../views/virtualization';

export default ({ vmName }) =>
  describe('ID (CNV-5970) Test creating a vm using simple wizard and adding an SSH key', () => {
    it('starting to create a vm', () => {
      virtualization.vms.visit();
      cy.byLegacyTestID('item-create').click();
      cy.byLegacyTestID('vm-wizard').click();
      cy.get('.kv-select-template__tile')
        .eq(1)
        .click();
      cy.byLegacyTestID('wizard-next')
        .as('nextButton')
        .click();
      cy.get('body').then(($body) => {
        if ($body.find('[data-test-id="modal-title"]').length) {
          cy.get('#confirm-action').click();
        }
      });
      cy.get('#image-source-type-dropdown').click();
      cy.contains('Import via Registry (creates PVC)').click();
      cy.get('#provision-source-container').type(ProvisionSource.REGISTRY.getSource());
      cy.get('@nextButton').click();
      cy.get('#vm-name')
        .clear()
        .type(vmName);
    });

    it('checking if SSH keys message is visible when SSH service is checked', () => {
      cy.get('#ssh-service-checkbox').check();
      cy.byTestID('SSHCreateService-info-message').should('be.visible');
    });

    it('should open authorized keys accordion', () => {
      cy.get('#authorized-key').click();
    });

    it('checking no restore button', () => {
      cy.get('.SSHFormKey-restore-button').should('not.exist');
    });

    it('checking no identity label', () => {
      cy.get('.SSHFormKey-helperText-success').should('not.exist');
      cy.get('.SSHFormKey-helperText-error').should('not.exist');
    });

    it('should add an SSH key', () => {
      cy.get('.SSHFormKey-input-field').type(sshFixure.key);
    });

    it('checking identity of key is correct', () => {
      cy.get('.SSHFormKey-helperText-success').should('be.visible');
    });

    it('checking remember SSH key is not checked', () => {
      cy.get('#ssh-store-auth-key-checkbox').should('not.be.checked');
    });

    it('should check remember SSH key', () => {
      cy.get('#ssh-store-auth-key-checkbox').check();
    });

    it('checking if SSH  helper modal exist', () => {
      cy.byLegacyTestID('ssh-popover-button').click();
      cy.byTestID('ssh-popover').should('be.visible');
    });

    it('checking if expose SSH service is checked by default', () => {
      cy.get('#ssh-service-checkbox').should('be.checked');
    });

    it('checking if SSH keys message is not visible', () => {
      cy.byTestID('SSHCreateService-info-message').should('not.exist');
    });

    it('should create a vm', () => {
      cy.byLegacyTestID('wizard-next').click();
      cy.byLegacyTestID('kubevirt-wizard-success-result').should('be.visible');
    });
  });
