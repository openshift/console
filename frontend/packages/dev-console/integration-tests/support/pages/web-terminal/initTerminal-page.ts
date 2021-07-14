import { formPO } from '../../pageObjects';
import { webTerminalPO } from '../../pageObjects/webterminal-po';

export const initTerminalPage = {
  clickOnProjectDropDawn: () => {
    cy.get(webTerminalPO.createProjectMenu.createProjectDropdownMenu).click();
  },

  selectCreateProjectButton: () => {
    cy.get(webTerminalPO.createProjectMenu.createProjectButton).click();
  },

  typeProjectName: (projectName: string) => {
    cy.get(webTerminalPO.projectNameMenu.projectNameField).type(projectName);
  },

  clickStartButton: () => {
    cy.get(formPO.create)
      .should('be.enabled')
      .click();
  },

  selectProject: (projectName: string) => {
    cy.get(`a#${projectName}-link`).click();
  },

  createAndStartTerminalInNewProject: (projectName: string) => {
    initTerminalPage.clickOnProjectDropDawn();
    initTerminalPage.selectCreateProjectButton();
    initTerminalPage.typeProjectName(projectName);
    initTerminalPage.clickStartButton();
  },

  startTerminalInExistedProject: (projectName: string) => {
    initTerminalPage.clickOnProjectDropDawn();
    initTerminalPage.selectProject(projectName);
    initTerminalPage.clickStartButton();
  },
};
