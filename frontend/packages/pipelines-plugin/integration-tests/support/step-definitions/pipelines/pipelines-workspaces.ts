import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { pipelineBuilderPage } from '../../pages/pipelines/pipelineBuilder-page';
import { pipelinesPO, pipelineBuilderPO } from '../../page-objects/pipelines-po';
import { pipelineDetailsPage } from '../../pages/pipelines/pipelineDetails-page';
import { startPipelineInPipelinesPage } from '../../pages/pipelines/pipelines-page';

When('user enters yaml content {string} in editor', (pipelineYamlFile: string) => {
  cy.fixture(`pipelines/pipelines-workspaces/${pipelineYamlFile}`).then((yaml) => {
    cy.log(yaml);
    pipelineBuilderPage.enterYaml(yaml);
  });
});

When('user clicks on create button in Edit Yaml file', () => {
  cy.get(pipelineBuilderPO.yamlCreatePipeline.create).click();
});

Given('user is at Edit Yaml page', () => {
  pipelineBuilderPage.clickYaml();
});

Given('user created pipeline with workspace', () => {
  pipelineBuilderPage.clickYaml();
  pipelineBuilderPage.selectSampleInYamlView('s2i-build-and-deploy-pipeline-using-workspace');
  // Instead of copy parseTwoDigitYear, we are using samples
  // cy.fixture(`pipelines/pipelines-workspaces/pipeline-with-workspace.yaml`).then((yaml) => {
  //   cy.log(yaml);
  //   pipelineBuilderPage.enterYaml(yaml);
  // });
  cy.get(pipelineBuilderPO.yamlCreatePipeline.create).click();
});

Then(
  'user is able to see different shared workspaces like Empty Directory, Config Map, Secret, PVC',
  () => {
    cy.byTestDropDownMenu('EmptyDirectory').should('be.visible');
    cy.byTestDropDownMenu('ConfigMap').should('be.visible');
    cy.byTestDropDownMenu('Secret').should('be.visible');
    cy.byTestDropDownMenu('PVC').should('be.visible');
  },
);

When('user selects shared workspaces drop down', () => {
  cy.get(pipelinesPO.startPipeline.sharedWorkspace).click();
});

Then(
  'user will be redirected to Pipeline Details page with header name {string}',
  (pipelineName: string) => {
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
);

When('user fills the yaml editor with sample {string}', (yamlSample: string) => {
  pipelineBuilderPage.selectSampleInYamlView(yamlSample);
});

When('user fills the Parameters in Start Pipeline modal', () => {
  cy.get('input[label="IMAGE_NAME"]').type('');
  cy.get('input[label="GIT_REPO"]').type('');
  cy.get('input[label="GIT_REVISION"]').type('');
});

When('user selects volume type {string} from workspaces dorp down', (volumeType: string) => {
  startPipelineInPipelinesPage.selectWorkSpace(volumeType);
});
