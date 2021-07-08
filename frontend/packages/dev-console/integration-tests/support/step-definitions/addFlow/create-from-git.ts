import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addOptions, buildConfigOptions, messages } from '../../constants';
import { gitPage, addPage, topologyPage, addHealthChecksPage, topologySidePane } from '../../pages';
import { dockerfilePage } from '../../pages/add-flow/dockerfile-page';

Given('user is at Import from git page', () => {
  addPage.selectCardFromOptions(addOptions.Git);
});

When('user enters Git Repo url as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage(gitUrl);
});

Then('git url gets Validated', () => {
  gitPage.verifyValidatedMessage();
});

Then('builder image is detected', () => {
  gitPage.verifyBuilderImageDetectedMessage();
});

Then('builder image version drop down is displayed', () => {
  gitPage.verifyBuilderImageVersion();
});

Then('Application name displays as {string}', (appName: string) => {
  gitPage.verifyAppName(appName);
});

Then('Name displays as {string}', (nodeName: string) => {
  gitPage.verifyNodeName(nodeName);
});

When('user selects resource type as {string}', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

Then(
  'user can see the created workload {string} is linked to existing application {string}',
  (workloadName: string, appName: string) => {
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
    topologyPage.getAppNode(appName).click({ force: true });
    topologySidePane.verifyResource(workloadName);
  },
);

When('user enters Application name as {string}', (appName: string) => {
  gitPage.enterAppName(appName);
});

When('user enters Name as {string}', (name: string) => {
  gitPage.enterComponentName(name);
});

When('user unselects the advanced option Create a route to the application', () => {
  gitPage.unselectRoute();
});

When('user enters name as {string} in General section', (name: string) => {
  gitPage.enterComponentName(name);
});

When('user enters Name as {string} in General section of Dockerfile page', (name: string) => {
  dockerfilePage.enterName(name);
});

When('user clicks {string} link in Advanced Options section', (linkName: string) => {
  cy.byButtonText(linkName).click();
});

When('user enters Hostname as {string}', (hostName: string) => {
  gitPage.enterRoutingHostName(hostName);
});

When('user enters Path as {string}', (path: string) => {
  gitPage.enterRoutingPath(path);
});

When('user selects default Target Port', () => {
  gitPage.selectTargetPortForRouting();
});

When('user enters name as {string} in General section', (name: string) => {
  gitPage.enterComponentName(name);
});

When(
  'user unselects Configure a webhook build trigger checkbox in build configuration section',
  () => {
    gitPage.uncheckBuildConfigOption(buildConfigOptions.webhookBuildTrigger);
  },
);

When(
  'user unselects Automatically build a new image when the builder image changes checkbox in build configuration section',
  () => {
    gitPage.uncheckBuildConfigOption(buildConfigOptions.automaticBuildImage);
  },
);

When(
  'user unselects Launch the first build when the build configuration is created checkbox in build configuration section',
  () => {
    gitPage.uncheckBuildConfigOption(buildConfigOptions.launchBuildOnCreatingBuildConfig);
  },
);

When('user enters Name as {string} in Environment Variables section', (envName: string) => {
  gitPage.enterBuildConfigEnvName(envName);
});

When('user enters Value as {string} in Environment Variables section', (envValue: string) => {
  gitPage.enterBuildConfigEnvValue(envValue);
});

Then('build does not get started for {string}', (nodeName: string) => {
  topologyPage.componentNode(nodeName).click({ force: true });
  topologySidePane.verify();
  cy.get('div.build-overview li.list-group-item > span').should(
    'contain.text',
    'No Builds found for this Build Config.',
  );
});

When('user verify the Auto deploy when new image is available checkbox is selected', () => {
  gitPage.verifyDeploymentOptionIsChecked();
});

When(
  'user enters Name as {string} in Environment Variables Runtime only section',
  (envName: string) => {
    gitPage.enterDeploymentEnvName(envName);
  },
);

When(
  'user enters Value as {string} in Environment Variables Runtime only section',
  (envValue: string) => {
    gitPage.enterDeploymentEnvValue(envValue);
  },
);

When('user enters CPU Request as {string} in CPU section', (cpuRequestValue: string) => {
  gitPage.enterResourceLimitCPURequest(cpuRequestValue);
});

When('user enters CPU Limits as {string} in CPU section', (cpuLimitValue: string) => {
  gitPage.enterResourceLimitCPULimit(cpuLimitValue);
});

When('user enters Memory Request as {string} in Memory section', (memoryRequestValue: string) => {
  gitPage.enterResourceLimitMemoryRequest(memoryRequestValue);
});

When('user enters Memory Limit as {string} in Memory section', (memoryLimitValue: string) => {
  gitPage.enterResourceLimitMemoryLimit(memoryLimitValue);
});

When('user enters number of replicas as {string} in Replicas section', (replicaCount: string) => {
  gitPage.enterScalingReplicaCount(replicaCount);
});

When('user fills the Readiness Probe details', () => {
  addHealthChecksPage.addReadinessProbe();
});

When('user fills the Liveness Probe details', () => {
  addHealthChecksPage.addLivenessProbe();
});

When('user fills the Startup Probe details', () => {
  addHealthChecksPage.addStartupProbe();
});

When('user enters label as {string}', (labelName: string) => {
  gitPage.enterLabels(labelName);
});

Then('public url is not created for node {string} in the workload sidebar', (nodeName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(nodeName);
  topologyPage.componentNode(nodeName).click({ force: true });
  topologySidePane.selectTab('Resources');
  topologySidePane.verifySection('Routes');
  cy.get('[role="dialog"] h2')
    .contains('Routes')
    .next('span')
    .should('contain.text', messages.addFlow.noRoutesFound);
});

Then(
  'the route of application {string} contains {string} in the Routes section of the workload sidebar',
  (nodeName: string, routeName: string) => {
    topologyPage.verifyWorkloadInTopologyPage(nodeName);
    topologyPage.componentNode(nodeName).click({ force: true });
    topologySidePane.selectTab('Resources');
    topologySidePane.verifySection('Routes');
    cy.get('a.co-external-link.co-external-link--block').should('contain.text', routeName);
  },
);

Then(
  'verify the label {string} in side bar of application node {string}',
  (labelName: string, nodeName: string) => {
    topologyPage.componentNode(nodeName).click({ force: true });
    topologySidePane.selectTab('Details');
    topologySidePane.verifyLabel(labelName);
    topologySidePane.close();
  },
);
