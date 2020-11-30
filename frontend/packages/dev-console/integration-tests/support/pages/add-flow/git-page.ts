import { gitAdvancedOptions, buildConfigOptions } from '../../constants/add';
import { messages } from '../../constants/staticText/addFlow-text';
import { gitPO } from '../../pageObjects/add-flow-po';

export const gitPage = {
  unselectRoute: () => cy.get(gitPO.advancedOptions.createRoute).uncheck(),
  verifyNoWorkLoadsText: (text: string) =>
    cy.get(gitPO.noWorkLoadsText).should('contain.text', text),
  verifyPipelinesSection: (message: string) => {
    cy.get('body').scrollTo('bottom');
    cy.get(gitPO.sectionTitle)
      .contains('Pipelines')
      .should('be.visible');
    cy.get(gitPO.pipeline.infoMessage).should('have.text', message);
  },
  enterGitUrl: (gitUrl: string) =>
    cy
      .get(gitPO.gitRepoUrl)
      .clear()
      .type(gitUrl),
  verifyPipelineCheckBox: () => cy.get(gitPO.pipeline.addPipeline).should('be.visible'),
  enterAppName: (appName: string) => {
    cy.get(gitPO.appName).then(($el) => {
      if ($el.prop('tagName').includes('button')) {
        cy.get(gitPO.appName).click();
        cy.get(`li #${appName}-link`).click();
      } else if ($el.prop('tagName').includes('input')) {
        cy.get(gitPO.appName)
          .scrollIntoView()
          .clear()
          .should('be.empty', { timeout: 3000 })
          .type(appName)
          .should('have.value', appName);
      } else {
        cy.log(`App name doesn't contain button or input tags`);
      }
    });
  },
  veirfyAppName: (nodeName: string) => cy.get(gitPO.appName).should('have.value', nodeName),
  enterComponentName: (name: string) => {
    cy.get(gitPO.nodeName)
      .scrollIntoView()
      .clear()
      .should('be.empty', { timeout: 3000 })
      .type(name)
      .should('have.value', name);
  },
  veirfyNodeName: (componentName: string) =>
    cy.get(gitPO.nodeName).should('have.value', componentName),
  selectResource: (resource: string = 'deployment') => {
    switch (resource) {
      case 'deployment':
      case 'Deployment':
        cy.get(gitPO.resources.deployment)
          .scrollIntoView()
          .check();
        break;
      case 'deployment config':
      case 'Deployment Config':
        cy.get(gitPO.resources.deploymentConfig)
          .scrollIntoView()
          .check();
        break;
      case 'Knative':
      case 'knative':
      case 'Knative Service':
        cy.get(gitPO.resources.knative)
          .scrollIntoView()
          .check();
        break;
      default:
        throw new Error('Resource option is not available');
        break;
    }
  },
  selectAdvancedOptions: (opt: gitAdvancedOptions) => {
    switch (opt) {
      case gitAdvancedOptions.Routing:
        cy.byButtonText('Routing').click();
        break;
      case gitAdvancedOptions.BuildConfig:
        cy.byButtonText('Build Configuration').click();
        break;
      case gitAdvancedOptions.Deployment:
        cy.byButtonText('Deployment').click();
        break;
      case gitAdvancedOptions.Scaling:
        cy.byButtonText('Scaling').click();
        break;
      case gitAdvancedOptions.ResourceLimits:
        cy.byButtonText('Resource Limits').click();
        break;
      case gitAdvancedOptions.Labels:
        cy.byButtonText('Labels').click();
        break;
      case gitAdvancedOptions.HealthChecks:
        cy.byButtonText('Health Checks').click();
        break;
      default:
        throw new Error('Advanced option is not available');
        break;
    }
  },
  selectAddPipeline: () =>
    cy
      .get(gitPO.pipeline.addPipeline)
      .scrollIntoView()
      .check(),
  clickCreate: () =>
    cy
      .get(gitPO.create)
      .should('be.enabled')
      .click(),
  clickCancel: () =>
    cy
      .get(gitPO.cancel)
      .should('be.enabled')
      .click(),
  verifyValidatedMessage: () =>
    cy.get(gitPO.gitSection.validatedMessage).should('have.text', messages.gitUrlValidated),
  verifyBuilderImageDetectedMessage: () =>
    cy.get(gitPO.builderSection.builderImageDetected).should('be.visible'),
  verifyBuilderImageVersion: () =>
    cy.get(gitPO.builderSection.builderImageVersion).should('be.visible'),
  selectTargetPortForRouting: () => {
    cy.get(gitPO.advancedOptions.routing.targetPort)
      .scrollIntoView()
      .clear()
      .type('8080');
  },
  enterRoutingHostName: (hostName: string) =>
    cy.get(gitPO.advancedOptions.routing.hostname).type(hostName),
  eneterRoutingPath: (path: string) => cy.get(gitPO.advancedOptions.routing.path).type(path),
  uncheckBuildConfigOption: (checkBoxName: string | buildConfigOptions) => {
    switch (checkBoxName) {
      case buildConfigOptions.webhookBuildTrigger:
        cy.get(gitPO.advancedOptions.buildConfig.webHookBuildTrigger)
          .should('be.visible')
          .uncheck();
        break;
      case buildConfigOptions.automaticBuildImage:
        cy.get(gitPO.advancedOptions.buildConfig.buildTriggerImage)
          .should('be.visible')
          .uncheck();
        break;
      case buildConfigOptions.launchBuildOnCreatingBuildConfig:
        cy.get(gitPO.advancedOptions.buildConfig.buildTriggerConfigField)
          .should('be.visible')
          .uncheck();
        break;
      default:
        throw new Error(
          `Unable to find the "${checkBoxName}" checbox in Build Configuration Section`,
        );
    }
  },
  enterBuildConfigEnvName: (envName: string) =>
    cy.get(gitPO.advancedOptions.buildConfig.envName).type(envName),
  enterBuildConfigEnvValue: (envValue: string) =>
    cy.get(gitPO.advancedOptions.buildConfig.envValue).type(envValue),
  verifyDeploymentOptionIsChecked: () => {
    cy.get(gitPO.advancedOptions.deployment.deploymentTriggerImage).should('be.checked');
  },
  enterDeploymentEnvName: (envName: string) =>
    cy.get(gitPO.advancedOptions.deployment.envName).type(envName),
  enterDeploymentEnvValue: (envValue: string) =>
    cy.get(gitPO.advancedOptions.deployment.envValue).type(envValue),
  enterResourceLimitCPURequest: (cpuResquestValue: string) =>
    cy.get(gitPO.advancedOptions.resourceLimit.cpuRequest).type(cpuResquestValue),
  enterResourceLimitCPULimit: (cpuLimitValue: string) =>
    cy.get(gitPO.advancedOptions.resourceLimit.cpuLimit).type(cpuLimitValue),
  enterResourceLimitMemoryRequest: (memoryRequestValue: string) =>
    cy.get(gitPO.advancedOptions.resourceLimit.memoryRequest).type(memoryRequestValue),
  enterResourceLimitMemoryLimit: (memoryLimitValue: string) =>
    cy.get(gitPO.advancedOptions.resourceLimit.memoryLimit).type(memoryLimitValue),
  enterScalingReplicaCount: (replicaCount: string) =>
    cy.get(gitPO.advancedOptions.scaling.replicaCount).type(replicaCount),
  enterLabels: (labelName: string) => cy.get(gitPO.advancedOptions.labels).type(labelName),
};
