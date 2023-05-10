import * as yamlEditor from '@console/cypress-integration-tests/views/yaml-editor';
import { pipelineBuilderPO } from '../../page-objects/pipelines-po';

export const tasksPage = {
  clickOnCreateTask: () => {
    cy.get('[data-test-id="dropdown-button"]').click();
    cy.byTestDropDownMenu('tasks').click();
    yamlEditor.isLoaded();
  },
  clearYAMLEditor: () => {
    cy.get(pipelineBuilderPO.yamlView.yamlEditor).click().focused().type('{ctrl}a').clear();
  },
  setEditorContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlEditor.setEditorContent(str);
    });
  },
  openTasksInPipelinesSidebar: () => {
    cy.byTestID('nav').contains('Pipelines').click();
    cy.byTestID('nav').contains('Tasks').click();
  },
  submitTaskYAML: () => {
    cy.byTestID('save-changes').click();
  },
  togglePipelineSidebar: () => {
    cy.byTestID('nav').contains('Pipelines').click();
  },
  openPipelinePage: () => {
    cy.get('[data-quickstart-id="qs-nav-pipelines"]').eq(1).click({ force: true });
  },
  clickOnCreatePipeline: () => {
    cy.get('[data-test-id="dropdown-button"]').click();
    cy.byTestDropDownMenu('pipeline').click();
  },
};
