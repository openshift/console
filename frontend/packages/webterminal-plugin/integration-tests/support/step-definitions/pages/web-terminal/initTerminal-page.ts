import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
import { formPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { webTerminalPO } from '@console/dev-console/integration-tests/support/pageObjects/webterminal-po';
import {
  app,
  perspective,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages/app';
import { searchResource } from '@console/dev-console/integration-tests/support/pages/search-resources/search-page';
import { webTerminalPage } from './webTerminal-page';

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
    cy.get('body').then(($body) => {
      cy.wait(5000);
      // Due to initialization issue if multiple operators present OCPBUGS-44891
      if ($body.find('[data-test="loading-box-body"]').length === 0) {
        cy.log('loading did not go through');
        cy.wait(10000);
        cy.get(webTerminalPO.terminalCloseWindowBtn).click();
        cy.reload();
        app.waitForDocumentLoad();
        perspective.switchTo(switchPerspective.Developer);
        projectNameSpace.selectProject('openshift-terminal');
        guidedTour.close();
        webTerminalPage.clickOpenCloudShellBtn();
        searchResource.searchResourceByNameAsDev('DevWorkspace');
        searchResource.selectSearchedItem('terminal');
        // cy.get('[data-test="loading-indicator"]').should('not.exist', { timeout: 210000 });
      } else {
        cy.wait(5000);
      }
    });
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
