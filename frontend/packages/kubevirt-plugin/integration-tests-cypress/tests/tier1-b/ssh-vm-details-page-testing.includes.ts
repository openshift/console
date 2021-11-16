// Not in ssh.spec until this is fixed: https://github.com/cypress-io/eslint-plugin-cypress/issues/43
import { VM_ACTION_TIMEOUT, VM_STATUS } from '../../utils/const/index';
import { detailsTab } from '../../views/selector';
import { virtualization } from '../../views/virtualization';

const AFTER_CREATE_WAIT_TIME = 3000;

export default ({ vmName }) =>
  describe('ID (CNV-5970) Test SSH info in vm details page', () => {
    it('should navigate to vm details page', () => {
      virtualization.vms.visit();
      cy.byLegacyTestID(vmName).click();
      cy.byLegacyTestID('horizontal-link-Details').click();

      // ensure vm is running before check SSH details
      cy.get(detailsTab.vmStatus, { timeout: VM_ACTION_TIMEOUT.VM_IMPORT }).should(
        'contain',
        VM_STATUS.Running,
      );
    });

    it('checking SSH user has value', () => {
      cy.get('[data-test=details-item-user-credentials-user-name]', { timeout: 600000 })
        .invoke('text')
        .then((text) => {
          expect(text).toMatch(/^user: [a-zA-z0-9].*$/);
        });
    });

    it('checking SSH port has value', () => {
      cy.get('[data-test=details-item-ssh-access-port]', { timeout: 600000 })
        .invoke('text')
        .then((text) => {
          expect(text).toMatch(/^port: [0-9]*$/);
        });
    });

    it('checking SSH command is correct', () => {
      const fieldsValue = { user: '', port: '' };
      cy.get('[data-test=details-item-user-credentials-user-name]', { timeout: 600000 })
        .invoke('text')
        .then((user) => {
          fieldsValue.user = user.replace('user: ', '');
        });
      cy.get('[data-test=details-item-ssh-access-port]')
        .invoke('text')
        .then((port) => {
          fieldsValue.port = port.replace('port: ', '');
        });
      cy.byTestID('SSHDetailsPage-command').within(() => {
        cy.get('input')
          .invoke('val')
          .then((value) => {
            const regex = `^ssh ${fieldsValue.user}@.* ${fieldsValue.port}$`;
            expect(value).toMatch(new RegExp(regex));
          });
      });
    });

    it('should open SSH service modal', () => {
      cy.get('[data-test="ssh-access-details-item"]')
        .find(detailsTab.vmEditWithPencil)
        .click();
    });

    it('checking SSH service checkbox is checked', () => {
      cy.get('#ssh-service-checkbox').should('be.checked');
    });

    it('should uncheck SSH service checkbox', () => {
      cy.get('[id=ssh-service-checkbox]').uncheck();
    });

    it('should close modal delete service', () => {
      cy.get('.SSHModal-main').within(() => {
        cy.get('#confirm-action').click();
      });
    });

    it('should navigate to services page', () => {
      // eslint-disable-next-line
      cy.wait(AFTER_CREATE_WAIT_TIME);
      cy.get('[data-test=nav]')
        .filter('[href$=services]')
        .then((link) => cy.visit(link.attr('href')));
    });

    it('checking vm SSH service is now deleted', () => {
      cy.byLegacyTestID(`${vmName}-ssh-service`).should('not.exist');
    });
  });
