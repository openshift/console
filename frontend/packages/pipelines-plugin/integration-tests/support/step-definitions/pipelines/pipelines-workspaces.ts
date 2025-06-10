import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { yamlEditor } from '@console/dev-console/integration-tests/support/pages';
import { pipelinesPO, pipelineBuilderPO, pipelineRunDetailsPO } from '../../page-objects';
import {
  pipelineDetailsPage,
  pipelineRunDetailsPage,
  pipelinesPage,
  startPipelineInPipelinesPage,
} from '../../pages';
import { pipelineBuilderPage } from '../../pages/pipelines/pipelineBuilder-page';

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

Given('user created pipeline with workspace using yaml {string}', (yamlFileName: string) => {
  pipelineBuilderPage.clickYaml();
  yamlEditor.isLoaded();
  pipelinesPage.clearYAMLEditor();
  pipelinesPage.setEditorContent(yamlFileName);
  cy.get(pipelineBuilderPO.create).click();
  detailsPage.titleShouldContain('s2i-build-and-deploy').should('be.visible');
});

Then(
  'user is able to see different shared workspaces like Empty Directory, Config Map, Secret, PVC, VolumeClaimTemplate',
  () => {
    cy.byTestDropDownMenu('emptyDirectory').should('be.visible');
    cy.byTestDropDownMenu('configMap').should('be.visible');
    cy.byTestDropDownMenu('secret').should('be.visible');
    cy.byTestDropDownMenu('pvc').should('be.visible');
    cy.byTestDropDownMenu('volumeClaimTemplate').should('be.visible');
    modal.cancel();
  },
);

When('user selects shared workspaces dropdown', () => {
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

When('user selects volume type {string} from workspaces dropdown', (volumeType: string) => {
  startPipelineInPipelinesPage.selectWorkSpace(volumeType);
});

Given('pipeline {string} is created with workspace', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithWorkspaces(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.search(pipelineName);
});

Then(
  'user will see {string} in the Workspace Resources section of Pipeline Run Details page',
  (volumeType: string) => {
    cy.get(pipelineRunDetailsPO.details.workspacesResources.emptyDirectory).should('be.visible');
    cy.log(`${volumeType} is visible`);
  },
);

Given('user created Config Map using yaml {string}', (yamlFile: string) => {
  const yamlFileName = `testData/pipelines-workspaces/using-optional-workspaces-in-when-expressions-pipelineRun/${yamlFile}`;
  cy.exec(`oc apply -f ${yamlFileName} -n ${Cypress.env('NAMESPACE')}`, {
    failOnNonZeroExit: false,
  });
});

Given('user created pipeline {string} with workspace', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithWorkspaces(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.search(pipelineName);
});

Given('user created Secret using yaml {string}', (yamlFile: string) => {
  const yamlFileName = `testData/pipelines-workspaces/${yamlFile}`;
  cy.exec(`oc apply -f ${yamlFileName} -n ${Cypress.env('NAMESPACE')}`, {
    failOnNonZeroExit: false,
  });
});

Given('user created PVC using yaml {string}', (yamlFile: string) => {
  const yamlFileName = `testData/pipelines-workspaces/${yamlFile}`;
  cy.exec(`oc apply -f ${yamlFileName} -n ${Cypress.env('NAMESPACE')}`, {
    failOnNonZeroExit: false,
  });
});

When('user selects {string} from Config Map dropdown', (ConfigMapValue: string) => {
  startPipelineInPipelinesPage.selectConfigMap(ConfigMapValue);
});

When('user selects Start button', () => {
  modal.submit();
});

When('user selects {string} from Secret dropdown', (secret: string) => {
  startPipelineInPipelinesPage.selectSecret(secret);
});

When('user selects {string} from PVC dropdown', (pvc: string) => {
  startPipelineInPipelinesPage.selectPVC(pvc);
});

Then(
  'user will see Config Map Workspace {string} mentioned in the Workspace Resources section of Pipeline Run Details page',
  (configMapResource: string) => {
    pipelineRunDetailsPage.verifyWorkspacesSection();
    cy.get(`[data-test-id^="${configMapResource}"]`).should('be.visible');
  },
);

Then(
  'user will see Secret Workspace {string} mentioned in the Workspace Resources section of Pipeline Run Details page',
  (secret: string) => {
    pipelineRunDetailsPage.verifyWorkspacesSection();
    cy.get(`[data-test-id^="${secret}"]`).should('be.visible');
  },
);

Then(
  'user will see PVC Workspace {string} mentioned in the Workspace Resources section of Pipeline Run Details page',
  (pvc: string) => {
    pipelineRunDetailsPage.verifyWorkspacesSection();
    cy.get(`[data-test-id^="${pvc}"]`).should('be.visible');
  },
);

Given('user created pipeline run using yaml {string}', (yamlFile: string) => {
  const yamlFileName = `testData/pipelines-workspaces/using-optional-workspaces-in-when-expressions-pipelineRun/${yamlFile}`;
  cy.byTestID('import-yaml').click();
  yamlEditor.isLoaded();
  pipelinesPage.clearYAMLEditor();
  pipelinesPage.setEditorContent(yamlFileName);
  cy.byTestID('save-changes').click();
});

When('user is at PipelineRun Details Page of {string}', (pipelineRunName: string) => {
  cy.contains('PipelineRun details').should('be.visible');
  cy.get('[data-test="page-heading"] h1').should('include.text', pipelineRunName);
});

When(
  'user selects "rerun" option from action menu for pipeline run {string}',
  (pipelineRunName: string) => {
    cy.get('[data-test="page-heading"] h1').should('include.text', pipelineRunName);
    cy.byLegacyTestID('actions-menu-button').click();
    cy.get('[data-test-action="Rerun"]').click();
  },
);
