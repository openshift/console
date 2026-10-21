import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { adminNavigationBar, switchPerspective } from '../../constants';
import { adminNavigationMenuPO } from '../../pageObjects';
import { podListPO } from '../../pageObjects/pod-list';
import { navigateToAdminMenu, perspective, projectNameSpace } from '../../pages';

Given('user navigates to administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Administrator);
});

When('user navigates to pods tab', async () => {
  cy.get(`${adminNavigationMenuPO.workloads.main}`).then(($expanded) => {
    if ($expanded.attr('aria-expanded')?.toString() === 'false') {
      navigateToAdminMenu(adminNavigationBar.Workloads);
    }
  });
  cy.get(adminNavigationMenuPO.workloads.pods).click();
});

When('user selects Receiving Traffic column to show in table', () => {
  cy.get(podListPO.manageColumns).click();
  cy.get(podListPO.createdColumn).uncheck();
  cy.get(podListPO.receivingTrafficColumn).check();
  cy.get(podListPO.confirmAction).click();
});

Then('user is able to see Receiving Traffic column in the list', () => {
  cy.get(podListPO.receivingTrafficColumnLabel).should('be.visible');
});

When('user selects {string} from the project menu', (projectName: string) => {
  projectNameSpace.selectOrCreateProject(projectName);
});
