import { ProvisionSource } from '../../enums/provisionSource';

export default ({ vmName }) =>
  describe('ID (CNV-5970) Test creating a vm using simple wizard and adding an ssh key', () => {
    it('starting to create a vm', () => {
      cy.get('[data-test=nav]')
        .filter('[href$=virtualization]')
        .then((link) => cy.visit(link.attr('href')));
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
    });

    it('checking if ssh keys message is visible', () => {
      cy.byTestID('SSHCreateService-info-message').should('be.visible');
    });

    it('should open authorized keys component', () => {
      cy.get('.SSHWizard-authorized-key').click();
    });

    it('checking no restore button', () => {
      cy.get('.SSHFormKey-restore-button').should('not.exist');
    });

    it('checking no identity label', () => {
      cy.get('.SSHFormKey-helperText-success').should('not.exist');
      cy.get('.SSHFormKey-helperText-error').should('not.exist');
    });

    it('should add an ssh key', () => {
      cy.fixture('ssh').then((ssh) => {
        cy.get('.SSHFormKey-input-field').type(ssh?.key);
      });
    });

    it('checking identity of key is correct', () => {
      cy.get('.SSHFormKey-helperText-success').should('be.visible');
    });

    it('checking remember ssh key is not checked', () => {
      cy.get('[id=ssh-service-checkbox]')
        .first()
        .should('not.be.checked');
    });

    it('should check remember ssh key', () => {
      cy.get('[id=ssh-service-checkbox]')
        .first()
        .check();
    });

    it('checking if ssh  helper modal exist', () => {
      cy.byLegacyTestID('ssh-popover-button').click();
      cy.byTestID('ssh-popover').should('be.visible');
    });

    it('checking if expose ssh service is checked by default', () => {
      cy.get('[id=ssh-service-checkbox]')
        .eq(1)
        .should('be.checked');
    });

    it('checking if ssh keys message is not visible', () => {
      cy.byTestID('SSHCreateService-info-message').should('not.exist');
    });

    it('should create a vm', () => {
      cy.byLegacyTestID('wizard-next').click();
      cy.byLegacyTestID('kubevirt-wizard-success-result').should('be.visible');
    });
  });
