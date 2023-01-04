import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  addOptions,
} from '@console/dev-console/integration-tests/support/constants';
import { pipelineTabs } from '@console/pipelines-plugin/integration-tests/support/constants';
import { pipelinesPage } from '@console/pipelines-plugin/integration-tests/support/pages';
import { actionsDropdownMenu } from '@console/pipelines-plugin/integration-tests/support/pages/functions/common';
import { addPage, app, navigateTo, pacPage } from '../../pages';

When('user clicks on the Import from Git card on the Add page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.ImportFromGit);
});

When('user enters secret as {string}', (secret: string) => {
  pacPage.enterSecret(secret);
});

When('user clicks the Generate Webhook Secret to generate Webhook secret', () => {
  pacPage.clickGenerateWebhookSecret();
});

Then('user will be redirected to {string} Repository Details page', (repoName: string) => {
  app.waitForLoad();
  detailsPage.titleShouldContain(repoName);
});

Then('user selects option {string} from Actions menu drop down', (action: string) => {
  actionsDropdownMenu.verifyActionsMenu();
  actionsDropdownMenu.selectAction(action);
});

When('user clicks Delete button on Delete Repository modal', () => {
  modal.modalTitleShouldContain('Delete Repository?');
  modal.submit();
  modal.shouldBeClosed();
});

Then(
  'user will be redirected to Repositories page to verify that {string} repository is not present',
  (repoName: string) => {
    navigateTo(devNavigationMenu.Pipelines);
    pipelinesPage.selectTab(pipelineTabs.Repositories);
    cy.byTestID('empty-message')
      .should('be.visible')
      .then(() => {
        cy.log(`${repoName} is deleted from cluster`);
      });
  },
);
