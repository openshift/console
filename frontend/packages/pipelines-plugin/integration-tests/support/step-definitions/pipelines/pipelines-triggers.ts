import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  pipelinesPage,
  startPipelineInPipelinesPage,
  pipelineBuilderPage,
  pipelineDetailsPage,
  triggerTemplateDetailsPage,
  eventListenerDetailsPage,
  clusterTriggerBindingDetailsPage,
} from '../../pages';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { pipelinesPO } from '../../page-objects/pipelines-po';
import { pipelineActions } from '../../constants';
import { actionsDropdownMenu } from '../../pages/functions/common';

When(
  'user selects {string} from the kebab menu for {string}',
  (option: string, pipelineName: string) => {
    pipelinesPage.selectActionForPipeline(pipelineName, option);
  },
);

Then('Git provider type field is enabled', () => {
  cy.get(pipelinesPO.addTrigger.gitProviderType).should('be.enabled');
});

Then('Add button is disabled', () => {
  cy.get(pipelinesPO.addTrigger.add).should('be.disabled');
  modal.cancel();
});

Given('user selected Add Trigger from kebab menu of pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.AddTrigger);
});

When('user clicks on {string} link', (linkName: string) => {
  cy.get(pipelinesPO.addTrigger.variablesLink)
    .contains(linkName)
    .click();
});

Then('user should be able to see {string} link with variables section', (linkName: string) => {
  cy.get(pipelinesPO.addTrigger.variablesLink)
    .contains(linkName)
    .should('be.visible');
});

Then('variables section displayed with message {string}', (text: string) => {
  cy.get(pipelinesPO.addTrigger.variablesMessage).should('contain.text', text);
});

Then('Add button is enabled', () => {
  cy.get(pipelinesPO.addTrigger.add).should('be.enabled');
  modal.cancel();
});

Given('{string} is displayed on pipelines page', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  cy.get('[data-test-id="breadcrumb-link-0"]').click();
  pipelinesPage.verifyNameInPipelinesTable(pipelineName);
});

When('user selects the {string} from Git Provider Type field', (gitProviderType: string) => {
  cy.get(pipelinesPO.addTrigger.gitProviderType).click();
  cy.get(`[id$="${gitProviderType}-link"]`).click({ force: true });
});

When('user clicks on Add button present in Add Trigger modal', () => {
  cy.get(pipelinesPO.addTrigger.add).click();
  modal.shouldBeClosed();
});

Then('pipelines page is displayed', () => {
  detailsPage.titleShouldContain('Pipelines');
});

Then('{string} is displayed in kebab menu for {string}', (option: string, pipelineName: string) => {
  pipelinesPage.selectKebabMenu(pipelineName);
  pipelinesPage.verifyOptionInKebabMenu(option);
});

Given('pipeline {string} with trigger in pipelines page', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.verifyNameInPipelinesTable(pipelineName);
  pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.AddTrigger);
  pipelinesPage.addTrigger();
});

When('user clicks pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
});

Then('pipeline Details page is displayed with header name {string}', (pipelineName: string) => {
  pipelineDetailsPage.verifyTitle(pipelineName);
});

Then('Trigger Templates section is displayed', () => {
  pipelineDetailsPage.verifyTriggerTemplateSection();
});

Given('user is at pipeline Details page of pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
  pipelineDetailsPage.verifyPage();
});

When('user clicks on trigger template', () => {
  pipelineDetailsPage.selectTriggerTemplateLink();
});

Then('user will be redirected to Trigger Template Details page', () => {
  triggerTemplateDetailsPage.verifyPage();
});

Then('user is able to see Details, YAML tabs', () => {
  triggerTemplateDetailsPage.verifyTabs();
});

Then(
  'Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Pipelines and Event Listeners',
  () => {
    triggerTemplateDetailsPage.verifyFields();
  },
);

Then('Actions dropdown display on the top right corner of the page', () => {
  actionsDropdownMenu.verifyActionsMenu();
});

Given('user is at Trigger Template Details page of pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
  pipelineDetailsPage.verifyPage();
  pipelineDetailsPage.selectTriggerTemplateLink();
  triggerTemplateDetailsPage.verifyPage();
});

When('user clicks on Event listener', () => {
  triggerTemplateDetailsPage.selectEventListener();
});

Then('user will be redirected to Event Listener Details page', () => {
  eventListenerDetailsPage.verifyPage();
});

Then(
  'Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Trigger Templates and Trigger Bindings',
  () => {
    eventListenerDetailsPage.verifyFields();
  },
);

Given('user is at Event Listener Details page of pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
  pipelineDetailsPage.verifyPage();
  pipelineDetailsPage.selectTriggerTemplateLink();
  triggerTemplateDetailsPage.verifyPage();
  triggerTemplateDetailsPage.selectEventListener();
  eventListenerDetailsPage.verifyPage();
});

When('user clicks on Trigger Binding', () => {
  eventListenerDetailsPage.selectTriggerBindingLink();
});

Then('user will be redirected to Cluster Trigger Binding Details page', () => {
  clusterTriggerBindingDetailsPage.verifyPage();
});

Then(
  'Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner',
  () => {
    clusterTriggerBindingDetailsPage.verifyFields();
  },
);

Then('Actions dropdown display on Cluster Trigger Binding page', () => {
  actionsDropdownMenu.verifyActionsMenu();
  navigateTo(devNavigationMenu.Pipelines);
});

When('user selects the first option from the Trigger Template drop down field', () => {
  cy.get(pipelinesPO.removeTrigger.triggerTemplate)
    .should('be.enabled')
    .click();
  cy.byLegacyTestID('dropdown-menu').click();
});

When('user clicks on Remove button', () => {
  cy.get(pipelinesPO.removeTrigger.remove)
    .should('be.enabled')
    .click({ force: true });
  modal.shouldBeClosed();
});

Then('modal is displayed with header message {string}', (headerName: string) => {
  modal.modalTitleShouldContain(headerName);
});

Then('trigger template dropdown displayed with help text Select Trigger Template', () => {
  cy.get(pipelinesPO.removeTrigger.triggerTemplate).should('have.text', 'Select TriggerTemplate');
});

Then('Remove button will be disabled', () => {
  cy.get(pipelinesPO.removeTrigger.remove).should('be.disabled');
  modal.cancel();
});

Then(
  'option {string} is not available in kebab menu for {string}',
  (option: string, pipelineName: string) => {
    pipelinesPage.search(pipelineName);
    pipelinesPage.selectKebabMenu(pipelineName);
    cy.byLegacyTestID('action-items')
      .find('li')
      .should('have.length', 6)
      .then(() => {
        cy.log(`${option} is not available`);
      });
  },
);

When('user enters git url as {string} in add trigger modal', (gitUrl: string) => {
  startPipelineInPipelinesPage.enterGitUrl(gitUrl);
});

When('user enters revision as {string} in add trigger modal', (revision: string) => {
  startPipelineInPipelinesPage.enterRevision(revision);
});
