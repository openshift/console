import { detailsPage } from '../views/details-page';
import { listPage } from '../views/list-page';
import { modal } from '../views/modal';

declare global {
  namespace Cypress {
    interface Chainable {
      createProject(name: string): Chainable<Element>;
      createProjectWithCLI(name: string): Chainable<Element>;
      deleteProject(name: string): Chainable<Element>;
      deleteProjectWithCLI(name: string, timeout?: number): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

// This will add to 'createProject(...)' to cy
// ex: cy.createProject(name)
Cypress.Commands.add('createProject', (name: string, devConsole: boolean = false) => {
  cy.log(`create project`);
  cy.visit(`/k8s/cluster/projects`);
  listPage.isCreateButtonVisible();
  listPage.clickCreateYAMLbutton();
  modal.shouldBeOpened();
  cy.byTestID('input-name').click().type(name);
  cy.testA11y('Create Project modal');
  modal.submit();
  modal.shouldBeClosed();
  if (devConsole === false) {
    listPage.titleShouldHaveText(name);
  }
});

Cypress.Commands.add('createProjectWithCLI', (name: string) => {
  cy.exec(`oc new-project ${name}`).its('stdout').should('contain', `Now using project "${name}"`);
});

Cypress.Commands.add('deleteProject', (name: string) => {
  cy.log(`delete project`);
  cy.visit(`/k8s/cluster/projects/${name}`);
  detailsPage.isLoaded();
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

Cypress.Commands.add('deleteProjectWithCLI', (name: string, timeout?: number) => {
  cy.exec(`oc delete project ${name}`, { timeout });
});
