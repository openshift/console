import { Given } from 'cypress-cucumber-preprocessor/steps';
import { projectNameSpace } from '@console/dev-console/integration-tests/support/pages';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';

Given('user is at developer perspective', () => {
  checkDeveloperPerspective();
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.expose('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});
