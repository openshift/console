import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions, devNavigationMenu, switchPerspective } from '../../constants';
import { addPagePO, samplesPO } from '../../pageObjects';
import {
  addPage,
  app,
  navigateTo,
  perspective,
  projectNameSpace,
  samplesPage,
  topologyPage,
  verifyAddPage,
} from '../../pages';
import { checkDeveloperPerspective } from '../../pages/functions/checkDeveloperPerspective';

Given('user is at developer perspective', () => {
  checkDeveloperPerspective();
  perspective.switchTo(switchPerspective.Developer);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given('user is at Add page', () => {
  checkDeveloperPerspective();
  navigateTo(devNavigationMenu.Add);
});

When('user clicks on the {string} link', () => {
  cy.get(addPagePO.viewAllSamples).click();
});

When('user is redirected to Samples Page', () => {
  cy.get('[data-test="page-heading"] h1').contains('Sample');
});

When('user clicks on the Samples card', () => {
  verifyAddPage.verifyAddPageCard('Samples');
  addPage.selectCardFromOptions(addOptions.Samples);
});

When('user selects {string} sample from Samples', (sample: string) => {
  samplesPage.search(sample);
  samplesPage.selectCardInSamples(sample);
});

When('user is able to see the form header name as {string}', (formName) => {
  app.waitForLoad();
  detailsPage.titleShouldContain(formName);
});

Then('form is filled with default values', () => {
  cy.get('input[name="git.url"]')
    .invoke('attr', 'value')
    .then((text) => {
      if (text !== undefined) {
        return true;
      }
      return false;
    });
  cy.byLegacyTestID('git-form-input-url').should('be.disabled');
});

Then('user will see builder image below builder image version dropdown', () => {
  cy.get('img[alt="Icon"]').should('be.visible');
});

Then('user is able to see different sample applications', () => {
  cy.get('[data-test*="Devfile"]').first().should('be.visible');
  cy.get('[data-test*="BuilderImage"]').first().should('be.visible');
});

Then('sample applications are based on the builder images', () => {
  cy.get('[data-test^="BuilderImage"]').then((elements) => {
    if (elements.length >= 1) {
      return true;
    }
    return false;
  });
});

When('user clicks on the Create button', () => {
  app.waitForLoad();
  cy.byLegacyTestID('submit-button').click();
});

When('user selects a sample card', () => {
  cy.get('[class*="catalog"]').first().click();
});

Then('user will see the name section', () => {
  cy.byLegacyTestID('application-form-app-name').should('be.visible');
});

Then('user will see builder image version dropdown', () => {
  cy.byTestID('console-select-menu-toggle').should('be.visible');
});

Then('user will see git url is ineditable field', () => {
  cy.byLegacyTestID('git-form-input-url').should('be.visible');
});

Then('user will see create and cancel button', () => {
  cy.byLegacyTestID('submit-button').should('be.visible');
  cy.byLegacyTestID('reset-button').should('be.visible');
});

Given('user is in Add flow of dev perspective', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user assign a new name as {string} in the name section', (workload: string) => {
  cy.byLegacyTestID('application-form-app-name').clear().type(workload);
});

When('user changes the builder image version from dropdown to {string}', (version: string) => {
  cy.byTestID('console-select-menu-toggle').should('be.visible').click();
  cy.byTestID('console-select-item').contains(version).click();
});

Then(
  'user is taken to topology with a {string} deployment workload created inside sample application',
  (workloadName: string) => {
    topologyPage.verifyTopologyPage();
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
  },
);

Given('user is at Samples page', () => {
  navigateTo(devNavigationMenu.Add);
  cy.get(addPagePO.viewAllSamples).click();
});

When('user clicks on the {string} card', (sample: string) => {
  samplesPage.selectCardInSamples(sample);
});

When(
  'user assigns a name {string} in the Name section of Import from Devfile form',
  (name: string) => {
    app.waitForLoad();
    cy.wait(10000);
    cy.get(samplesPO.form.name).clear().type(name);
  },
);

Then(
  'user is taken to Topology page with deployment workload {string} created',
  (workloadName: string) => {
    topologyPage.verifyTopologyPage();
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
  },
);
