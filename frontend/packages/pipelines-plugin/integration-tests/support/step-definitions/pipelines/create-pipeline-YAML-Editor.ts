import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import * as yamlEditor from '@console/cypress-integration-tests/views/yaml-editor';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages/app';
import { pipelineBuilderPO } from '../../page-objects/pipelines-po';
import { pipelinesPage, startPipelineInPipelinesPage } from '../../pages/pipelines/pipelines-page';

Given('user is at {string} on Pipeline Builder page', (view: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.clickOnCreatePipeline();
  startPipelineInPipelinesPage.selectView(view);
});

When('user creates pipeline resource using YAML editor from {string}', (yamlLocation: string) => {
  yamlEditor.isLoaded();
  pipelinesPage.clearYAMLEditor();
  pipelinesPage.setEditorContent(yamlLocation);
  cy.get(pipelineBuilderPO.create).click();
});

When(
  'user creates pipeline using YAML and CLI {string} in namespace {string}',
  (yamlFile: string, namespace: string) => {
    cy.exec(`oc apply -f ${yamlFile} -n ${namespace}`);
  },
);

Then('user will see pipeline {string} in pipelines page', (pipelineName: string) => {
  navigateTo(devNavigationMenu.Add);
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
});
