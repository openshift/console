import { authenticationTypes } from '@console/dev-console/integration-tests/support/constants';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';

export const editDeployment = {
  verifyModalTitle: () => {
    cy.get(topologyPO.createSecret.formInputs.secretFormTitle).should('be.visible');
  },
  addSecretName: (secretName: string) => {
    cy.get(topologyPO.createSecret.formInputs.secretName)
      .clear()
      .type(secretName);
  },
  selectAuthenticationType: (authenticationType: authenticationTypes | string) => {
    cy.get(topologyPO.createSecret.formInputs.authenticationType).click();
    switch (authenticationType) {
      case 'Image registry credentials':
      case authenticationTypes.ImageRegistryCredentials: {
        cy.byTestActionID(authenticationType)
          .should('be.visible')
          .click();
        break;
      }
      case 'Upload configuration file':
      case authenticationTypes.UploadConfigurationFile: {
        cy.byTestActionID(authenticationType)
          .should('be.visible')
          .click();
        break;
      }
      default: {
        throw new Error(`${authenticationType} is not available in action menu`);
      }
    }
  },
  addServerAddress: (serverUrl: string) => {
    cy.get(topologyPO.createSecret.formInputs.registryServerAddress)
      .clear()
      .type(serverUrl);
  },
  enterUsername: (username: string) => {
    cy.get(topologyPO.createSecret.formInputs.userName)
      .clear()
      .type(username);
  },
  enterPassword: (password: string) => {
    cy.get(topologyPO.createSecret.formInputs.password)
      .clear()
      .type(password);
  },
  enterEmail: (email: string) => {
    cy.get(topologyPO.createSecret.formInputs.email)
      .clear()
      .type(email);
  },
  saveSecret: () => {
    cy.get(topologyPO.createSecret.formInputs.saveSecret).click();
  },
  selectDeploymentStrategyType: (strategyType: string) => {
    cy.get(topologyPO.deploymentStrategy.strategyTypeDropDown).click();

    if (strategyType === 'Rolling Update') {
      cy.get(topologyPO.deploymentStrategy.rollingUpdate).click();
    } else if (strategyType === 'Recreate') {
      cy.get(topologyPO.deploymentStrategy.recreateStrategy).click();
    } else if (strategyType === 'Custom') {
      cy.get(topologyPO.deploymentStrategy.customUpdate).click();
    }
  },
  selectProjectName: (projectName: string) => {
    cy.get(topologyPO.deploymentStrategy.projectDropDown).click();
    cy.get(`[id="${projectName}-link"]`).click();
  },
  selectImageStream: (imageStream: string) => {
    cy.get(topologyPO.deploymentStrategy.imageStream).click();
    cy.get(`[id="${imageStream}-link"]`).click();
  },
  selectImageStreamTag: (tag: string) => {
    cy.get(topologyPO.deploymentStrategy.tag).click();
    cy.get(`[id="${tag}-link"]`).click();
  },
  addPreCycleHook: (workloadName: string, failurePolicy: string) => {
    cy.get(topologyPO.deploymentStrategy.preLifecycleHook.preExecNewPod).click();
    cy.get(topologyPO.deploymentStrategy.preLifecycleHook.preExecNewPodContainerDD).click();
    cy.get(`[id="${workloadName}-link"]`).click();
    cy.get(topologyPO.deploymentStrategy.preLifecycleHook.runCommand)
      .clear()
      .type('echo "PreLifeCycle Hook"');
    cy.get(topologyPO.deploymentStrategy.preLifecycleHook.failurePolicy).click();
    cy.get(`[id="${failurePolicy}-link"]`).click();
    cy.get(topologyPO.deploymentStrategy.tickButton).click();
  },
  selectProject: (projectName: string) => {
    cy.get(`[id="${projectName}-link"]`).click();
  },
  selectImage: (imageStream: string) => {
    cy.get(`[id="${imageStream}-link"]`).click();
  },
  selectImageTag: (tag: string) => {
    cy.get(`[id="${tag}-link"]`).click();
  },
  addMidCycleHook: (workloadName: string, failurePolicy: string) => {
    cy.get(topologyPO.deploymentStrategy.midLifecycleHook.midTagImagesField).click();
    cy.get(topologyPO.deploymentStrategy.midLifecycleHook.midTagImagesFieldContainerDD).click();
    cy.get(`[id="${workloadName}-link"]`).click();
    cy.get(topologyPO.deploymentStrategy.midLifecycleHook.projectDropDown).click();
    editDeployment.selectProject('openshift');
    cy.get(topologyPO.deploymentStrategy.midLifecycleHook.imageStream).click();
    editDeployment.selectImage('golang');
    cy.get(topologyPO.deploymentStrategy.midLifecycleHook.imageStreamTag).click();
    editDeployment.selectImageTag('latest');
    cy.get(topologyPO.deploymentStrategy.midLifecycleHook.failurePolicy).click();
    cy.get(`[id="${failurePolicy}-link"]`).click();
    cy.get(topologyPO.deploymentStrategy.tickButton).click();
  },
  addPostCycleHook: (workloadName: string, failurePolicy: string) => {
    cy.get(topologyPO.deploymentStrategy.postLifecycleHook.postExecNewPod).click();
    cy.get(topologyPO.deploymentStrategy.postLifecycleHook.postExecNewPodContainerNameDD).click();
    cy.get(`[id="${workloadName}-link"]`).click();
    cy.get(topologyPO.deploymentStrategy.postLifecycleHook.runCommand)
      .clear()
      .type('echo "PostLifeCycle Hook"');
    cy.get(topologyPO.deploymentStrategy.postLifecycleHook.failurePolicy).click();
    cy.get(`[id="${failurePolicy}-link"]`).click();
    cy.get(topologyPO.deploymentStrategy.tickButton).click();
  },
};
