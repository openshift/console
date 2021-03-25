import { detailsPage } from '../views/details-page';
import { listPage } from '../views/list-page';
import { modal } from '../views/modal';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      createProject(name: string): Chainable<Element>;
      deleteProject(name: string): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

// This will add to 'createProject(...)' to cy
// ex: cy.createProject(name)
Cypress.Commands.add('createProject', (name: string, devConsole: boolean = false) => {
  cy.log(`create project`);
  cy.visit(`/k8s/cluster/projects`);
  listPage.rows.shouldBeLoaded();
  listPage.clickCreateYAMLbutton();
  modal.shouldBeOpened();
  cy.byTestID('input-name')
    .click()
    .type(name);
  cy.testA11y('Create Project modal');
  modal.submit();
  modal.shouldBeClosed();
  // TODO, switch to 'listPage.titleShouldHaveText(name)', when we switch to new test id
  if (devConsole === false) {
    cy.byLegacyTestID('resource-title').should('have.text', name);
  }
});

Cypress.Commands.add('deleteProject', (name: string) => {
  cy.log(`delete project`);
  cy.visit(`/k8s/cluster/projects/${name}`);
  detailsPage.clickPageActionFromDropdown('Delete Project');
  modal.shouldBeOpened();
  modal.submitShouldBeDisabled();
  cy.byTestID('project-name-input').type(name);
  modal.submitShouldBeEnabled();
  cy.testA11y('Delete Project modal');
  modal.submit();
  modal.shouldBeClosed();
  listPage.titleShouldHaveText('Projects');
});
