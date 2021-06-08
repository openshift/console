import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPO } from '../../page-objects/topology-po';
import { gitPage } from '@console/dev-console/integration-tests/support/pages/add-flow';
import { addSecret } from '@console/topology/integration-tests/support/pages/functions/add-secret';
import { topologyHelper } from '@console/topology/integration-tests/support/pages/topology/topology-helper-page';
import { editDeployment } from '../../pages/topology/topology-edit-deployment';

When('user edits application groupings to {string}', (newAppName: string) => {
  gitPage.editAppName(newAppName);
});

When('user saves the new changes', () => {
  cy.get(topologyPO.createSecret.formInputs.saveSecret).click();
});

Then('user can see application groupings updated to {string}', (newAppName: string) => {
  topologyHelper.verifyWorkloadInTopologyPage(newAppName);
});

When('user clicks on Show advanced image options', () => {
  if (cy.get(topologyPO.createSecret.advancedOptions).contains('Show advanced image options')) {
    cy.get(topologyPO.createSecret.advancedOptions).click();
  } else {
    cy.log('You have already opened advanced options');
  }
});

When('user clicks on Create new secret', () => {
  cy.get(topologyPO.createSecret.createSecretButton)
    .contains('Create new Secret')
    .click();
});

When('user creates a new secret {string}', (secretName: string) => {
  addSecret(secretName);
});

When('user clicks on {string} from context action menu', (actionItem: string) => {
  cy.byTestActionID(actionItem)
    .should('be.visible')
    .click();
});

Then('user will see {string} in secret name dropdown under Pull secret', (secretName: string) => {
  cy.get(topologyPO.createSecret.secretDropDown).click();
  cy.get(topologyPO.createSecret.secretDropDownItem).should('contain', secretName);
  cy.get(topologyPO.createSecret.formInputs.cancelAction).click();
});

When('user enters value of CPU Request as {string}', (requestCPU: string) => {
  cy.get(topologyPO.resourceLimits.requestCPU)
    .clear()
    .type(requestCPU);
});

When('user enters value of CPU Limit as {string}', (limitCPU: string) => {
  cy.get(topologyPO.resourceLimits.limitCPU)
    .clear()
    .type(limitCPU);
});

When('user enters value of Memory Request as {string}', (requestMemory: string) => {
  cy.get(topologyPO.resourceLimits.requestMemory)
    .clear()
    .type(requestMemory);
});

When('user enters value of Memory Limit as {string}', (limitMemory: string) => {
  cy.get(topologyPO.resourceLimits.limitMemory)
    .clear()
    .type(limitMemory);
});

When('user clicks on Save', () => {
  cy.get(topologyPO.createSecret.formInputs.saveSecret).click();
});

Then('user will be redirected to Topology with the updated resource limits', () => {
  cy.get(topologyPO.graph.emptyGraph).should('be.visible');
});

When('user selects {string} Strategy type under Deployment Strategy', (strategyType: string) => {
  editDeployment.selectDeploymentStrategyType(strategyType);
});

When(
  'user enters value of Maximum number of unavailable Pods and Maximum number of surge Pods as {string}',
  (podPercentage: string) => {
    cy.get(topologyPO.deploymentStrategy.maxUnavailablePods)
      .clear()
      .type(podPercentage);
    cy.get(topologyPO.deploymentStrategy.maxSurgePods)
      .clear()
      .type(podPercentage);
  },
);

When(
  'user selects value of project, image stream and tag section under images as {string}, {string} and {string} respectively',
  (projectName: string, imageStream: string, tag: string) => {
    editDeployment.selectProjectName(projectName);
    editDeployment.selectImageStream(imageStream);
    editDeployment.selectImageStreamTag(tag);
  },
);

When('user enters NAME as {string} and VALUE as {string}', (envName: string, envValue: string) => {
  cy.get(topologyPO.deploymentStrategy.envName)
    .clear()
    .type(envName);
  cy.get(topologyPO.deploymentStrategy.envValue)
    .clear()
    .type(envValue);
});

When('user selects secret {string} from Pull secret dropdown', (secretName: string) => {
  cy.get(topologyPO.deploymentStrategy.selectSecret).click();
  const CSSSelector = `[id="${secretName}-link"]`;
  cy.get(CSSSelector).click();
});

When('user selects the Pause rollouts check box under advanced options section', () => {
  cy.get(topologyPO.deploymentStrategy.advancedOptions)
    .eq(0)
    .click();
  cy.get(topologyPO.deploymentStrategy.pauseRolloutsCheckbox).click();
});

When('user enters Replicas as {string} under Scaling section', (replicaCount: string) => {
  cy.get(topologyPO.deploymentStrategy.advancedOptions)
    .find('Scaling')
    .click();
  cy.get(topologyPO.deploymentStrategy.enterReplica)
    .clear()
    .type(replicaCount);
});

When('user will be redirected to Topology with the updated deployment', () => {
  cy.get(topologyPO.graph.emptyGraph).should('be.visible');
});

When('user saves the changes', () => {
  cy.get(topologyPO.deploymentStrategy.saveEdit).click();
});

When('user enters Timeout value as {string}', (timeoutValue: string) => {
  cy.get(topologyPO.deploymentStrategy.timeout)
    .clear()
    .type(timeoutValue);
});

When('user clicks on Show additional parameters and lifcycle hooks', () => {
  cy.get(topologyPO.createSecret.advancedOptions)
    .eq(0)
    .click();
});

When(
  'user adds Pre Cycle Hook for workload {string} with failure policy {string}',
  (workloadName: string, failurePolicy: string) => {
    cy.contains('Add pre lifecycle hook').click();
    editDeployment.addPreCycleHook(workloadName, failurePolicy);
  },
);

When(
  'user adds Mid Cycle Hook for workload {string} with failure policy {string}',
  (workloadName: string, failurePolicy: string) => {
    cy.contains('Add mid lifecycle hook').click();
    editDeployment.addMidCycleHook(workloadName, failurePolicy);
  },
);

When(
  'user adds Post Cycle Hook for workload {string} with failure policy {string}',
  (workloadName: string, failurePolicy: string) => {
    cy.contains('Add post lifecycle hook').click();
    editDeployment.addPostCycleHook(workloadName, failurePolicy);
  },
);

When('user unchecks Deploy image from an image stream tag checkbox', () => {
  cy.get(topologyPO.deploymentStrategy.deployImageCheckbox).click();
});

When('user enters value of Image name as {string}', (imageLink: string) => {
  cy.get(topologyPO.deploymentStrategy.imageName)
    .clear()
    .type(imageLink);
});

When('user enters key as {string}', (annotationKey: string) => {
  cy.get(topologyPO.graph.addNewAnnotations).click();
  cy.get(topologyPO.deploymentStrategy.envName)
    .last()
    .clear()
    .type(annotationKey);
});

When('user enters value as {string} to which it will be connected', (annotationValue: string) => {
  cy.get(topologyPO.deploymentStrategy.envValue)
    .last()
    .clear()
    .type(annotationValue);
  cy.get(topologyPO.graph.deleteWorkload).click();
});

Then('user can see that two workloads are connected with arrow', () => {
  cy.get(topologyPO.graph.connector).should('be.visible');
});
