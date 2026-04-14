import { formPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { webTerminalPO } from '@console/dev-console/integration-tests/support/pageObjects/webterminal-po';
import { app } from '@console/dev-console/integration-tests/support/pages/app';

export const initTerminalPage = {
  clickOnProjectDropDown: () => {
    app.waitForDocumentLoad();
    cy.get(webTerminalPO.createProjectMenu.createProjectDropdownMenu).click('center');
  },

  selectCreateProjectButton: () => {
    cy.get(webTerminalPO.createProjectMenu.createProjectButton).click();
  },

  typeProjectName: (projectName: string) => {
    cy.get(webTerminalPO.projectNameMenu.projectNameField).type(projectName);
  },

  clickStartButton: () => {
    cy.get(formPO.create).should('be.enabled').click({ force: true });
    // Wait for the loading indicator to appear after clicking Start.
    // The previous implementation used a synchronous $body.find() check that
    // relied on React committing the update before Cypress's .then() callback
    // ran. Under createRoot, renders are deferred so the check always failed,
    // triggering a recovery path that left the app in a broken state (OCPBUGS-82510).
    cy.get('[data-test="loading-box-body"]').should('exist');
  },

  selectProject: (projectName: string) => {
    cy.byTestID(webTerminalPO.createProjectMenu.inputField)
      .type(projectName)
      .should('have.value', projectName);
    cy.byTestID('console-select-item').contains(projectName).click();
  },

  createAndStartTerminalInNewProject: (projectName: string) => {
    initTerminalPage.clickOnProjectDropDown();
    initTerminalPage.selectCreateProjectButton();
    initTerminalPage.typeProjectName(projectName);
    initTerminalPage.clickStartButton();
  },

  startTerminalInExistedProject: (projectName: string) => {
    initTerminalPage.clickOnProjectDropDown();
    initTerminalPage.selectProject(projectName);
    initTerminalPage.clickStartButton();
  },
};
