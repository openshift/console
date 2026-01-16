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
  // Try to create or switch to the project
  // Accept both "Now using project" (new) and "Already on project" (existing)
  cy.exec(`oc new-project ${name}`, { failOnNonZeroExit: false }).then((result) => {
    if (result.code === 0) {
      // Success - either created new or switched to existing
      expect(result.stdout).to.satisfy(
        (stdout: string) =>
          stdout.includes(`Now using project "${name}"`) ||
          stdout.includes(`Already on project "${name}"`),
      );
    } else {
      // Failed - throw error with details
      throw new Error(`Failed to create/switch to project ${name}: ${result.stderr}`);
    }
  });
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
