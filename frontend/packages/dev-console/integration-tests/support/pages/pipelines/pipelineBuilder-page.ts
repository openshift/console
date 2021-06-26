import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import {
  pipelineBuilderPO,
  pipelineDetailsPO,
  pipelinesPO,
} from '@console/dev-console/integration-tests/support/pageObjects';
import { pipelineDetailsPage } from './pipelineDetails-page';

export const pipelineBuilderPage = {
  verifyTitle: () => cy.get(pipelineBuilderPO.title).should('have.text', pageTitle.PipelineBuilder),
  verifyDefaultPipelineName: (pipelineName: string = 'new-pipeline') =>
    cy.get(pipelineBuilderPO.formView.name).should('have.value', pipelineName),
  enterPipelineName: (pipelineName: string) => {
    cy.get(pipelineBuilderPO.formView.name).clear();
    cy.get(pipelineBuilderPO.formView.name).type(pipelineName);
  },
  selectTask: (taskName: string = 'kn') => {
    cy.get(pipelineBuilderPO.formView.taskDropdown).click();
    cy.byTestActionID(taskName).click({ force: true });
  },
  clickOnTask: (taskName: string) => {
    cy.get(`[data-id="${taskName}"] text`).click({ force: true });
  },
  selectParallelTask: (taskName: string) => {
    cy.mouseHover(pipelineBuilderPO.formView.task);
    cy.get(pipelineBuilderPO.formView.plusTaskIcon)
      .eq(2)
      .click({ force: true });
    cy.get(pipelineBuilderPO.formView.parallelTask).click();
    cy.byTestActionID(taskName).click();
  },
  selectSeriesTask: (taskName: string) => {
    cy.mouseHover(pipelineBuilderPO.formView.task);
    cy.get(pipelineBuilderPO.formView.plusTaskIcon)
      .first()
      .click({ force: true });
    cy.get(pipelineBuilderPO.formView.seriesTask).click();
    cy.byTestActionID(taskName).click();
  },
  addParameters: (
    paramName: string,
    description: string = 'description',
    defaultValue: string = 'value1',
  ) => {
    cy.byButtonText('Add Parameters').click();
    cy.get(pipelineBuilderPO.formView.addParams.name).type(paramName);
    cy.get(pipelineBuilderPO.formView.addParams.description).type(description);
    cy.get(pipelineBuilderPO.formView.addParams.defaultValue).type(defaultValue);
  },
  addResource: (resourceName: string, resourceType: string = 'Git') => {
    cy.get('div.pf-c-form__group button[type="button"]')
      .eq(1)
      .click();
    cy.get(pipelineBuilderPO.formView.addResources.name).type(resourceName);
    cy.selectByDropDownText(pipelineBuilderPO.formView.addResources.resourceType, resourceType);
  },
  verifySection: () => {
    cy.get(pipelineBuilderPO.formView.sectionTitle).as('sectionTitle');
    cy.get('@sectionTitle')
      .eq(0)
      .should('have.text', 'Tasks');
    cy.get('@sectionTitle')
      .eq(1)
      .should('have.text', 'Parameters');
    cy.get('@sectionTitle')
      .eq(2)
      .should('have.text', 'Resources');
  },
  clickCreateButton: () => cy.get(pipelineBuilderPO.create).click(),
  editYaml: () => {
    cy.get(pipelinesPO.createPipeline).click();
    cy.get(pipelineBuilderPO.configureVia.yamlView).click();
  },
  enterYaml: (yamlContent: string) => {
    cy.get(pipelineBuilderPO.yamlCreatePipeline.yamlEditor)
      .click()
      .focused()
      .type('{ctrl}a')
      .type(yamlContent);
  },
  createPipelineFromBuilderPage: (pipelineName: string, taskName: string = 'kn') => {
    pipelineBuilderPage.enterPipelineName(pipelineName);
    pipelineBuilderPage.selectTask(taskName);
    pipelineBuilderPage.clickCreateButton();
    cy.get(pipelineDetailsPO.title).should('be.visible');
  },
  createPipelineFromYamlPage: () => {
    pipelineBuilderPage.editYaml();
    cy.get(pipelineBuilderPO.create).click();
  },
  createPipelineWithGitResources: (
    pipelineName: string = 'git-pipeline',
    taskName: string = 'openshift-client',
    resourceName: string = 'git resource',
  ) => {
    pipelineBuilderPage.enterPipelineName(pipelineName);
    pipelineBuilderPage.selectTask(taskName);
    pipelineBuilderPage.addResource(resourceName);
    pipelineBuilderPage.clickOnTask(taskName);
    cy.get(pipelineBuilderPO.formView.sidePane.dialog).within(() => {
      cy.selectByDropDownText('[data-test-id="dropdown-button"]', resourceName);
    });
    pipelineBuilderPage.clickCreateButton();
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
  selectSampleInYamlView: (yamlSample: string) => {
    cy.get(pipelineBuilderPO.yamlCreatePipeline.samples.sidebar).within(() => {
      cy.get('li.co-resource-sidebar-item')
        .contains(yamlSample)
        .parent()
        .find('button')
        .contains('Try it')
        .click();
    });
  },
};
