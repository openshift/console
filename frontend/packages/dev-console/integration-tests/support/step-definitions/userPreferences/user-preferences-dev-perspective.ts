import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { addOptions, devNavigationMenu, switchPerspective } from '../../constants';
import { gitPO } from '../../pageObjects';
import {
  getPreferenceDropdown,
  getTab,
  userPreferencePO,
} from '../../pageObjects/userPreference-po';
import {
  addPage,
  app,
  catalogPage,
  createGitWorkload,
  gitPage,
  navigateTo,
  perspective,
  projectNameSpace,
  topologyHelper,
} from '../../pages';

Given('user is at admin perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Administrator);
});

When('user clicks on user dropdown on masthead and selects {string}', (menuItem: string) => {
  cy.get(userPreferencePO.userMenu)
    .should('be.visible')
    .click();
  cy.get("[role='menu']")
    .find('li')
    .contains(menuItem)
    .should('be.visible')
    .click();
});

Then('user sees {string} tab selected on User Preferences page', (sideTab: string) => {
  cy.get(getTab(sideTab)).should('be.visible');
});

Then('user sees {string} tab on User Preferences page', (sideTab: string) => {
  cy.get(getTab(sideTab)).should('be.visible');
});

When(
  'user changes user preference {string} dropdown to {string}',
  (group: string, preferance: string) => {
    cy.selectByDropDownText(getPreferenceDropdown(group), preferance);
  },
);

When('user reloads the console without perspective', () => {
  cy.reload();
  app.waitForLoad();
});

Then('user sees the {string} perspective', (userPerspective: string) => {
  nav.sidenav.switcher.shouldHaveText(userPerspective);
});

Given('user has created project {string}', (projectName) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

When('user selects {string} from the project menu', (projectName: string) => {
  projectNameSpace.selectOrCreateProject(projectName);
});

When('user clicks on {string} dropdown on User Preferences page', (group: string) => {
  cy.get(getPreferenceDropdown(group))
    .should('be.visible')
    .click();
});

When('user searches and selects project {string} from the dropdown', (preference: string) => {
  cy.get(userPreferencePO.namespaceTypeahead)
    .clear()
    .should('not.have.value');
  cy.get(userPreferencePO.namespaceTypeahead)
    .type(preference)
    .should('have.value', preference);
  cy.get('[data-test="dropdown console.preferredNamespace"]')
    .find('li')
    .contains(preference)
    .click();
});

When('user reloads the console', () => {
  cy.reload();
  app.waitForLoad();
});

Then('user can see project {string} is selected', (projectName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Topology);
  app.waitForLoad();
  cy.get('[data-test-id="namespace-bar-dropdown"] span.pf-c-menu-toggle__text').should(
    'contain.text',
    projectName,
  );
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE', projectName)}`, {
    failOnNonZeroExit: false,
  });
});

When('user types project {string} in search bar', (preference: string) => {
  cy.get(userPreferencePO.namespaceTypeahead)
    .clear()
    .should('not.have.value');
  cy.get(userPreferencePO.namespaceTypeahead)
    .type(preference)
    .should('have.value', preference);
});

When('user clicks on Create project option from the dropdown', () => {
  cy.get(userPreferencePO.creteProjectButton)
    .should('be.visible')
    .click();
});

When('user clicks on Create with name {string} in Create Project modal', (projectName: string) => {
  modal.shouldBeOpened();
  cy.get('#input-name').type(projectName);
  cy.get('#confirm-action').click();
  app.waitForLoad();
});

Given('user has created or selected namespace {string}', (projectName) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given(
  'user has created workload {string} with resource type {string}',
  (componentName: string, resourceType: string = 'Deployment') => {
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceType,
      'nodejs-ex-git-app',
    );
    topologyHelper.verifyWorkloadInTopologyPage(componentName);
  },
);

When('user clicks on Topology in navigation menu', () => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Topology);
});

Then('user can see topology graph view', () => {
  cy.get('[data-id="odc-topology-graph"]').should('be.visible');
});

Then('user can see topology list view', () => {
  cy.get('[aria-label="Topology List View"]').should('be.visible');
});

When('user clicks on Add in navigation menu', () => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Add);
});

When('user clicks on Helm charts', () => {
  addPage.selectCardFromOptions(addOptions.HelmChart);
});

When('user selects {string} helm chart', (cardName: string) => {
  catalogPage.search(cardName);
  catalogPage.selectHelmChartCard(cardName);
});

When('user clicks on Install Helm Chart button', () => {
  catalogPage.clickButtonOnCatalogPageSidePane();
});

Then('user can see Form view option selected in Install Helm Chart page', () => {
  cy.get('#form-radiobutton-editorType-form-field').should('be.checked');
});

Then('user can see YAML view option selected in Install Helm Chart page', () => {
  cy.get('#form-radiobutton-editorType-yaml-field').should('be.checked');
});

When('user clicks on {string} tab on User Preferences page', (tab: string) => {
  cy.get(getTab(tab))
    .should('be.visible')
    .click();
});

When('user clicks on the checkbox to uncheck it', () => {
  cy.get(userPreferencePO.checkboxPreferredLanguage)
    .should('be.visible')
    .uncheck();
});

Then('user will see the language change to 日本語', () => {
  cy.get('h1.ocs-page-layout__title')
    .invoke('attr', 'value')
    .then(($initialVal) => {
      if ($initialVal !== 'ユーザー設定') {
        cy.wait(5000);
      }
      cy.get('h1.ocs-page-layout__title').should('contain.text', 'ユーザー設定');
    });
  // After execution of all tests Language value is changed back to English
  cy.selectByDropDownText(getPreferenceDropdown('Language'), 'English');
});

When('user deselects the checkbox of user preference Secure Route', () => {
  // cy.get().uncheck();
});

Given('user clicks on {string} card', (cardName) => {
  addPage.selectCardFromOptions(cardName);
});

When('user enters Git Repo URL as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage(gitUrl);
});

When('user enters Name as {string} in General section', (name: string) => {
  gitPage.enterComponentName(name);
});

When('user clicks {string} link in Advanced Options section', (linkName: string) => {
  cy.byButtonText(linkName).click();
});

Then('user is able to see Secure Route checkbox is deselected', () => {
  cy.get(gitPO.advancedOptions.routing.secureRoute).should('not.be.checked');
});
