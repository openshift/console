// Not in ssh.spec until this is fixed: https://github.com/cypress-io/eslint-plugin-cypress/issues/43
import { VM_ACTION_TIMEOUT, VM_STATUS } from '../../const/index';
import { detailsTab } from '../../view/selector';

const AFTER_CREATE_WAIT_TIME = 3000;

export default ({ vmName }) =>
  describe('ID (CNV-5970) Test ssh info in vm details page', () => {
    it('should navigate to vm details page', () => {
      cy.get('[data-test=nav]')
        .filter('[href$=virtualization]')
        .then((link) => cy.visit(link.attr('href')));
      cy.byLegacyTestID(vmName).click();
      cy.byLegacyTestID('horizontal-link-Details').click();

      // ensure vm is running before check ssh details
      cy.get(detailsTab.vmStatus, { timeout: VM_ACTION_TIMEOUT.VM_IMPORT }).should(
        'contain',
        VM_STATUS.Running,
      );
    });

    it('checking ssh user has value', () => {
      cy.byTestID('SSHDetailsPage-user', { timeout: 600000 })
        .invoke('text')
        .then((text) => {
          expect(text).toMatch(/^user: [a-zA-z0-9].*$/);
        });
    });

    it('checking ssh port has value', () => {
      cy.byTestID('SSHDetailsPage-port', { timeout: 600000 })
        .invoke('text')
        .then((text) => {
          expect(text).toMatch(/^port: [0-9]*$/);
        });
    });

    it('checking ssh command is correct', () => {
      const fieldsValue = { user: '', port: '' };
      cy.byTestID('SSHDetailsPage-user')
        .invoke('text')
        .then((user) => {
          fieldsValue.user = user.replace('user: ', '');
        });
      cy.byTestID('SSHDetailsPage-port')
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

    it('should open ssh service modal', () => {
      cy.get('[id=SSHDetailsPage-service-modal]').click();
    });

    it('checking ssh service checkbox is checked', () => {
      cy.get('[id=ssh-service-checkbox]').should('be.checked');
    });

    it('should uncheck ssh service checkbox', () => {
      cy.get('[id=ssh-service-checkbox]').uncheck();
    });

    it('should close modal delete service', () => {
      cy.get('.SSHModal-main').within(() => {
        cy.get('[id=confirm-action]').click();
      });
    });

    it('should navigate to services page', () => {
      // eslint-disable-next-line
      cy.wait(AFTER_CREATE_WAIT_TIME);
      cy.get('[data-test=nav]')
        .filter('[href$=services]')
        .then((link) => cy.visit(link.attr('href')));
    });

    it('checking vm ssh service is now deleted', () => {
      cy.byLegacyTestID(`${vmName}-ssh-service`).should('not.exist');
    });
  });
