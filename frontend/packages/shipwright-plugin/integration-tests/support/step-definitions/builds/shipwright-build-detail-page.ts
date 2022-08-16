import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants';
import { perspective, navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { buildPO, resourceRow } from '../../pageObjects';

When('user has created shipwright builds', () => {
  cy.exec(
    `oc apply -n ${Cypress.env('NAMESPACE')} -f testData/builds/shipwrightBuildStrategies.yaml`,
    {
      failOnNonZeroExit: false,
    },
  );

  const yamlFileName = `testData/builds/shipwrightBuild.yaml`;
  cy.exec(`oc apply -n ${Cypress.env('NAMESPACE')} -f ${yamlFileName}`, {
    failOnNonZeroExit: false,
  }).then(function(result) {
    cy.log(result.stdout);
  });
});

When('user navigates to Builds in Developer perspective', () => {
  navigateTo(devNavigationMenu.Builds);
});

When('user switches to Administrative perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

When('user clicks on Builds navigation in Administrative perspective', () => {
  cy.get(buildPO.admin.buildTab)
    .should('be.visible')
    .click();
});

Then('user will see {string} tab', (tab: string) => {
  cy.get(buildPO.admin.nav)
    .contains(tab)
    .should('be.visible');
});

Given('user is on Builds navigation in Developer perspective', () => {
  navigateTo(devNavigationMenu.Builds);
});

Then('user will see {string}, {string} and {string} in Filter list', (el1, el2, el3: string) => {
  cy.get(buildPO.filter)
    .should('be.visible')
    .click();
  cy.get(buildPO.filterList)
    .should('contain', el1)
    .and('contain', el2)
    .and('contain', el3);
});

When('user clicks on {string} tab', (tab: string) => {
  cy.byLegacyTestID(`horizontal-link-${tab}`)
    .should('be.visible')
    .click();
});

When('user clicks on Event tab', () => {
  cy.get(buildPO.eventTab)
    .should('be.visible')
    .click();
});

When('user will see Shipwright Builds', () => {
  cy.get(buildPO.dev.buildTab).should('be.visible');
});

When('user clicks on {string} build', (build: string) => {
  cy.byLegacyTestID(`${build}`)
    .should('be.visible')
    .click();
});

When('user will see {string}, {string} and {string}', (el1, el2, el3: string) => {
  cy.get(buildPO.pane)
    .should('contain', el1)
    .and('contain', el2)
    .and('contain', el3);
});

Then('user will see events steaming', () => {
  cy.get(buildPO.eventStream).should('be.visible');
});

Given('user is at Shipwright Builds details page for build {string}', (buildName: string) => {
  navigateTo(devNavigationMenu.Builds);
  cy.get(buildPO.shipwrightBuild.shipwrightBuildsTab)
    .should('be.visible')
    .click();
  cy.byLegacyTestID(`${buildName}`)
    .should('be.visible')
    .click();
  cy.get('[aria-label="Breadcrumb"]').should('contain', 'Build details');
});

When('user clicks on Filter', () => {
  cy.get(buildPO.filter)
    .should('be.visible')
    .click();
});

When(
  'user will see {string}, {string}, {string}, {string} and {string} options',
  (el1, el2, el3, el4, el5: string) => {
    cy.get(buildPO.filterList)
      .should('contain', el1)
      .and('contain', el2)
      .and('contain', el3)
      .and('contain', el4)
      .and('contain', el5);
  },
);

When('user clicks on build run {string}', (buildRun: string) => {
  cy.byLegacyTestID(`${buildRun}`).click();
});

Then('user will see {string} section', (section: string) => {
  cy.get(`[data-test-section-heading="${section}"]`).should('be.visible');
});

Then(
  'user will see {string}, {string} and {string} section in BuildRun details',
  (el1, el2, el3: string) => {
    cy.get(buildPO.pane)
      .should('contain', el1)
      .and('contain', el2)
      .and('contain', el3);
  },
);

Given('user is at Shipwright Builds run page {string}', (buildName: string) => {
  navigateTo(devNavigationMenu.Builds);
  cy.get(buildPO.shipwrightBuild.shipwrightBuildsTab)
    .should('be.visible')
    .click();
  cy.byLegacyTestID(`${buildName}`)
    .should('be.visible')
    .click();
  cy.get(buildPO.shipwrightBuild.shipwrightBuildRunsTab)
    .should('be.visible')
    .click();
});

When('user has a failed build run', () => {
  cy.exec(`oc apply -n ${Cypress.env('NAMESPACE')} -f testData/builds/shipwrightBuildRun.yaml`, {
    failOnNonZeroExit: false,
  });
  cy.byLegacyTestID('buildpack-nodejs-build-heroku-1')
    .should('be.visible')
    .click();
  cy.byLegacyTestID('breadcrumb-link-0')
    .should('be.visible')
    .click();
  cy.get(buildPO.filter)
    .should('be.visible')
    .click();
  cy.get(buildPO.failedFilter)
    .should('be.visible')
    .click();
  cy.get(resourceRow).should('be.visible');
});

When('user clicks on Failed Status', () => {
  cy.get(buildPO.shipwrightBuild.statusText)
    .first()
    .should('be.visible')
    .click();
});

Then('user will see pop up with error message', () => {
  cy.get(buildPO.popup).should('be.visible');
});
