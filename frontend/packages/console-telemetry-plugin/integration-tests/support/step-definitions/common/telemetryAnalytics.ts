import { Given } from 'cypress-cucumber-preprocessor/steps';
import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
import {
  perspective,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';

Given('user is at developer perspective', () => {
  checkDeveloperPerspective();
  perspective.switchTo(switchPerspective.Developer);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});
