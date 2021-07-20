import { ProvisionSource } from '../../enums/provisionSource';

export default ({ vmName }) =>
  describe('ID (CNV-5971) Test if ssh service is present in advanced wizard', () => {
    it('should navigate to advanced wizard', () => {
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
        .type(`${vmName}-advanced-wizard`);
      cy.byLegacyTestID('wizard-customize').click();
      cy.get('.pf-c-wizard__nav-link')
        .filter(':contains("Advanced")')
        .click();
    });

    it('should open ssh accordion', () => {
      cy.get('[id=ssh]').click();
    });

    it('checking expose service is checked', () => {
      cy.get('[id=ssh-service-checkbox]').should('be.checked');
    });

    it('should continue to create vm', () => {
      cy.get('[id=create-vm-wizard-reviewandcreate-btn]').click();
      cy.get('[id=create-vm-wizard-submit-btn]').click();
      cy.byLegacyTestID('kubevirt-wizard-success-result').should('be.visible');
    });

    it('should navigate to services', () => {
      cy.get('[data-test=nav]')
        .filter('[href$=services]')
        .then((link) => cy.visit(link.attr('href')));
    });

    it('checking vm ssh service is present', () => {
      cy.byLegacyTestID(`${vmName}-advanced-wizard-ssh-service`).should('be.exist');
    });
  });
