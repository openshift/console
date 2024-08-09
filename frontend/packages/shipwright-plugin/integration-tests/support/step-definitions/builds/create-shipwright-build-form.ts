import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devFilePage, gitPage } from '@console/dev-console/integration-tests/support/pages';
import { buildsPage } from '../../../pages/builds-page';
import { createShipwrightBuildPage } from '../../../pages/creatre-shipwright-build-page';
import { createShipwrightBuildPO } from '../../pageObjects/build-po';

When('user select create Build option', () => {
  buildsPage.clickOnCreateShipwrightBuild();
});

When('user is at Create Shipwright build page', () => {
  createShipwrightBuildPage.verifyTitle();
});

When('user enters Name as {string}', (name: string) => {
  createShipwrightBuildPage.enterBuildName(name);
});

When('user enters Git Repo URL as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  devFilePage.verifyValidatedMessage(gitUrl);
});

When('user select Build Strategy option {string}', (buildStrategy: string) => {
  createShipwrightBuildPage.selectBuildStrategyOption(buildStrategy);
});

When('user enters builder-image param as {string}', (builderImage: string) => {
  createShipwrightBuildPage.enterBuilderImage(builderImage);
});

When('user enters Output image as {string}', (outputImage: string) => {
  createShipwrightBuildPage.enterOutputImage(outputImage);
});

When('user clicks Create button', () => {
  cy.get(createShipwrightBuildPO.submitButton).should('be.enabled').click();
});

Then('user will be redirected to {string} build details page', (name: string) => {
  cy.get(createShipwrightBuildPO.detailsPageTitle).should('have.text', name);
});

Then('user will see Strategy {string}', (buildStrategy: string) => {
  cy.get(`[data-test=${buildStrategy}]`).should('have.text', buildStrategy);
});

Then('user will see Source URL {string}', (gitUrl: string) => {
  cy.get(createShipwrightBuildPO.detailsPageSourceURLItem).should('have.text', gitUrl);
});

Then('user will see Builder image {string}', (builderImage: string) => {
  cy.get(createShipwrightBuildPO.detailsPageBuilderImageItem).should('have.text', builderImage);
});
