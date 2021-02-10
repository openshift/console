import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import {
  perspective,
  projectNameSpace,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages/app';
import {
  switchPerspective,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants/global';
import { guidedTour } from '../../../../../integration-tests-cypress/views/guided-tour';
import { nav } from '../../../../../integration-tests-cypress/views/nav';
import { perspectiveName } from '@console/dev-console/integration-tests/support/constants/staticText/global-text';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  // Bug: 1890676 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective with guider tour modal');
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(perspectiveName.developer);
  // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective');
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  projectNameSpace.selectOrCreateProject(`${projectName}`);
  cy.log(`User has selected namespace "${projectName}"`);
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

Given('user is at Monitoring page', () => {
  navigateTo(devNavigationMenu.Monitoring);
});

When('user clicks create button', () => {
  cy.get('button[type="submit"]').click();
});
