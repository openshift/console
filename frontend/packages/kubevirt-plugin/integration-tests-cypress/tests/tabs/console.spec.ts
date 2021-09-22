import { testName } from '../../support';
import { K8S_KIND, VM_ACTION, YAML_VM_NAME } from '../../utils/const/index';
import {
  warningUserLoggedIn,
  noActiveUser,
  noUserLoggedIn,
  oneActiveUser,
  serialEmptyState,
  timeOfLogin,
} from '../../utils/const/string';
import { selectActionFromDropdown } from '../../views/actions';
import { emptyState, disconnectSerial, loginSerial, loginVNC } from '../../views/console';
import { actionButtons, alertDescription, dashboardTab, modalCancel } from '../../views/selector';
import { loggedInUser } from '../../views/selector-tabs';
import { tab } from '../../views/tab';
import { vm } from '../../views/vm';

describe('Test VM console tab', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
    cy.visitVMsList();
    cy.createDefaultVM();
    tab.navigateToDetails();
    vm.start();
    cy.waitForLoginPrompt(YAML_VM_NAME, testName);
    tab.navigateToOverview();
    cy.get(dashboardTab.guestAgentOK, { timeout: 300000 }).should('exist');
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, YAML_VM_NAME, testName);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-872) VNC console connects', () => {
    tab.navigateToConsole();
    loginVNC();
    // after login VNC console, scroll up is flaky
    // so revisit VM tabs explicitly
    cy.visit('/');
    cy.visitVMsList();
    cy.byLegacyTestID(YAML_VM_NAME)
      .should('exist')
      .click();
    if (Cypress.env('DOWNSTREAM')) {
      tab.navigateToDetails();
      cy.get(loggedInUser).should('not.contain', noActiveUser);
      cy.get(loggedInUser).should('contain', timeOfLogin);
    }
    // TODO: disconnect VNC console after bz1964789 is fixed
  });

  it('ID(CNV-3609) Serial console connects', () => {
    tab.navigateToConsole();
    loginSerial();
    cy.visit('/');
    cy.visitVMsList();
    cy.byLegacyTestID(YAML_VM_NAME)
      .should('exist')
      .click();
    if (Cypress.env('DOWNSTREAM')) {
      tab.navigateToOverview();
      cy.get(dashboardTab.detailsCardItem)
        .eq(8)
        .should('not.contain', noUserLoggedIn); // Active Users
      cy.get(dashboardTab.detailsCardItem)
        .eq(8)
        .should('contain', oneActiveUser); // Active Users
    }
    // verify warning showing on VM actions while user is logged in
    [VM_ACTION.Stop, VM_ACTION.Restart, VM_ACTION.Delete].forEach((action) => {
      selectActionFromDropdown(action, actionButtons.actionDropdownButton);
      cy.contains(alertDescription, warningUserLoggedIn).should('be.visible');
      cy.get(modalCancel).click();
    });
    // disconnect serial console
    tab.navigateToConsole();
    disconnectSerial();
    cy.get(emptyState).should('contain', serialEmptyState);
    cy.byButtonText('Connect').should('exist');
  });
});
