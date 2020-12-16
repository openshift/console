import { pipelineBuilderPO, pipelineDetailsPO } from '../../pageObjects/pipelines-po';
import { pipelineDetailsPage } from './pipelineDetails-page';

export const pipelineBuilderPage = {
  verifyTitle: () => cy.get(pipelineBuilderPO.title).should('have.text', 'Pipeline Builder'),
  verifyDefaultPipelineName: (pipelineName: string = 'new-pipeline') =>
    cy.get(pipelineBuilderPO.name).should('have.value', pipelineName),
  enterPipelineName: (pipelineName: string) => {
    cy.get(pipelineBuilderPO.name).clear();
    cy.get(pipelineBuilderPO.name).type(pipelineName);
  },
  selectTask: (taskName: string = 'kn') => {
    cy.get(pipelineBuilderPO.taskDropdown).click();
    cy.byTestActionID(taskName).click();
  },
  clickOnTask: (taskName: string) =>
    cy
      .get(pipelineBuilderPO.task)
      .contains(taskName)
      .click(),
  selectParallelTask: (taskName: string) => {
    cy.mouseHover('.odc-pipeline-vis-task__content');
    cy.get('g.odc-plus-node-decorator')
      .eq(2)
      .click();
    pipelineBuilderPage.selectTask(taskName);
  },
  selectSeriesTask: (taskName: string) => {
    cy.mouseHover('.odc-pipeline-vis-task__content');
    cy.get('g.odc-plus-node-decorator')
      .eq(0)
      .click();
    pipelineBuilderPage.selectTask(taskName);
  },
  addParameters: (
    paramName: string,
    description: string = 'description',
    defaultValue: string = 'value1',
  ) => {
    cy.byButtonText('Add Parameters').click();
    cy.get(pipelineBuilderPO.addParams.name).type(paramName);
    cy.get(pipelineBuilderPO.addParams.description).type(description);
    cy.get(pipelineBuilderPO.addParams.defaultValue).type(defaultValue);
  },
  addResource: (resourceName: string, resourceType: string = 'Git') => {
    cy.get('div.pf-c-form__group button[type="button"]')
      .eq(1)
      .click();
    cy.get(pipelineBuilderPO.addResources.name).type(resourceName);
    cy.selectByDropDownText(pipelineBuilderPO.addResources.resourceType, resourceType);
  },
  verifySection: () => {
    cy.get(pipelineBuilderPO.sectionTitle).as('sectionTitle');
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
    cy.byButtonText('Edit YAML').click();
    cy.get('form[name="form"]').should('be.visible');
    cy.byTestID('confirm-action').click();
    cy.get('[data-mode-id="yaml"]').should('be.visible');
  },
  createPipelineFromBuilderPage: (pipelineName: string, taskName: string = 'kn') => {
    pipelineBuilderPage.enterPipelineName(pipelineName);
    pipelineBuilderPage.selectTask(taskName);
    pipelineBuilderPage.clickCreateButton();
    cy.get(pipelineDetailsPO.title).should('be.visible');
  },
  createPipelineFromYamlPage: () => {
    pipelineBuilderPage.editYaml();
    cy.get(pipelineBuilderPO.switchToYamlEditorAlert.alertDialog).should('be.visible');
    cy.get(pipelineBuilderPO.switchToYamlEditorAlert.title).should(
      'contain.text',
      'Switch to YAML Editor?',
    );
    cy.get(pipelineBuilderPO.switchToYamlEditorAlert.continue).click();
    cy.get(pipelineBuilderPO.yamlCreatePipeline.helpText).should('contain.text', 'YAML or JSON');
    cy.get(pipelineBuilderPO.yamlCreatePipeline.create).click();
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
    cy.get(pipelineBuilderPO.sidePane.inputResource).click();
    cy.byTestDropDownMenu(resourceName).click();
    pipelineBuilderPage.clickCreateButton();
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
};
