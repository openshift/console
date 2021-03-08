import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import { pipelineBuilderText } from '../../constants/static-text/pipeline-text';
import { pipelineBuilderPO, pipelineDetailsPO, pipelinesPO } from '../../page-objects/pipelines-po';
import { pipelineDetailsPage } from './pipelineDetails-page';

export const pipelineBuilderSidePane = {
  verifyDialog: () => cy.get(pipelineBuilderPO.formView.sidePane.dialog).should('be.visible'),
  selectInputResource: (resourceName: string) => {
    cy.get(pipelineBuilderPO.formView.sidePane.dialog).within(() => {
      cy.get(pipelineBuilderPO.formView.sidePane.inputResource).select(resourceName);
    });
  },
  removeTask: () => {
    cy.get(pipelineBuilderPO.formView.sidePane.dialog).within(() => {
      cy.selectByDropDownText(pipelineBuilderPO.formView.sidePane.actions, 'Remove Task');
    });
  },
};

export const pipelineBuilderPage = {
  verifyTitle: () => {
    cy.get(pipelineBuilderPO.title).should('have.text', pageTitle.PipelineBuilder);
    cy.testA11y(pageTitle.PipelineBuilder);
  },
  verifyDefaultPipelineName: (pipelineName: string = pipelineBuilderText.pipelineName) =>
    cy.get(pipelineBuilderPO.formView.name).should('have.value', pipelineName),
  enterPipelineName: (pipelineName: string) => {
    cy.get(pipelineBuilderPO.formView.name)
      .clear()
      .type(pipelineName);
  },
  selectTask: (taskName: string = 'kn') => {
    cy.get(pipelineBuilderPO.formView.taskDropdown).click();
    cy.byTestActionID(taskName).click({ force: true });
  },
  clickOnTask: (taskName: string) => cy.get(`[data-id="${taskName}"] text`).click({ force: true }),
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
    cy.byButtonText('Add parameter').click();
    cy.get(pipelineBuilderPO.formView.addParams.name).type(paramName);
    cy.get(pipelineBuilderPO.formView.addParams.description).type(description);
    cy.get(pipelineBuilderPO.formView.addParams.defaultValue).type(defaultValue);
  },
  addResource: (resourceName: string, resourceType: string = 'Git') => {
    cy.get(pipelineBuilderPO.formView.addResourcesLink)
      .eq(1)
      .click();
    cy.get(pipelineBuilderPO.formView.addResources.name).type(resourceName);
    cy.get(pipelineBuilderPO.formView.addResources.resourceType).select(resourceType);
  },
  verifySection: () => {
    cy.get(pipelineBuilderPO.formView.sectionTitle).as('sectionTitle');
    cy.get('@sectionTitle')
      .eq(0)
      .should('have.text', pipelineBuilderText.formView.Tasks);
    cy.get('@sectionTitle')
      .eq(1)
      .should('have.text', pipelineBuilderText.formView.Parameters);
    cy.get('@sectionTitle')
      .eq(2)
      .should('have.text', pipelineBuilderText.formView.Resources);
    cy.get('@sectionTitle')
      .eq(3)
      .should('have.text', pipelineBuilderText.formView.Workspaces);
  },
  clickCreateButton: () => cy.get(pipelineBuilderPO.create).click(),
  clickYaml: () => {
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
    pipelineBuilderPage.clickYaml();
    // Modal is removed - so commented the below code
    // cy.get(pipelineBuilderPO.switchToYamlEditorAlert.alertDialog).should('be.visible');
    // cy.get(pipelineBuilderPO.switchToYamlEditorAlert.title).should(
    //   'contain.text',
    //   'Switch to YAML Editor?',
    // );
    // cy.get(pipelineBuilderPO.switchToYamlEditorAlert.continue).click();
    // cy.get(pipelineBuilderPO.yamlCreatePipeline.helpText).should('contain.text', 'YAML or JSON');
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
    pipelineBuilderSidePane.selectInputResource(resourceName);
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
