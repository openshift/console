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
    cy.get('[data-test="loading-box-body"]').should('exist', { timeout: 5000 }); // wait for "loading..." appears
    cy.get('[data-test="loading-box-body"]').should('not.exist', { timeout: 90000 }); // wait for terminal loading
  },

  selectProject: (projectName: string) => {
    cy.byTestID(webTerminalPO.createProjectMenu.inputField)
      .type(projectName)
      .should('have.value', projectName);
    cy.byTestID('dropdown-menu-item-link').contains(projectName).click();
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
