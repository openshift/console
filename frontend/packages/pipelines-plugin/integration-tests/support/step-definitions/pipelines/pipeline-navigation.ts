import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { pipelineTabs } from '../../constants';
import { pipelinesPage } from '../../pages/pipelines/pipelines-page';
import { repositoriesPage } from '../../pages/pipelines/repositories-page';

When('user navigates to Repositories page', () => {
  pipelinesPage.selectTab(pipelineTabs.Repositories);
});

When('user navigates to Builds page', () => {
  navigateTo(devNavigationMenu.Builds);
});

Then('user will be redirected to the repositories page', () => {
  cy.get('.co-m-horizontal-nav__menu-item.co-m-horizontal-nav-item--active > a').should(
    'have.text',
    'Repositories',
  );
});

When('user click on create repository button', () => {
  pipelinesPage.clickCreateRepository();
});

When('user will redirects to Add Git Repository page', () => {
  repositoriesPage.verifyTitle();
});

When('user enter the GitRepo URL {string}', (GitRepoURL: string) => {
  cy.get('#form-input-gitUrl-field')
    .clear()
    .type(GitRepoURL);
});

When('user enters the name {string}', (name: string) => {
  cy.get('#form-input-name-field').should('have.value', name);
});

When('user clicks on add button', () => {
  cy.byLegacyTestID('submit-button').click();
});

Then('user will be redirected to Git Repository added page', () => {
  cy.byTestID('repository-overview-title').should('have.text', 'Git repository added.');
});

Then('user clicks on close button', () => {
  cy.byLegacyTestID('submit-button').click();
});

Then('user will be redirected to PipelineRuns tab', () => {
  cy.get('.co-m-horizontal-nav__menu-item.co-m-horizontal-nav-item--active > a').should(
    'have.text',
    'PipelineRuns',
  );
});
