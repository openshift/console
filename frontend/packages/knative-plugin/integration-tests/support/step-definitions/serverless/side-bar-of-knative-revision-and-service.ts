import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { containerImagePage } from '@console/dev-console/integration-tests/support/pages';
import {
  topologyPage,
  topologySidePane,
} from '@console/topology/integration-tests/support/pages/topology';

When('user clicks on the revision of knative service {string}', (serviceName: string) => {
  topologyPage.verifyUserIsInGraphView();
  topologyPage.waitForKnativeRevision();
  topologyPage.getKnativeRevision(serviceName).click({ force: true });
});

When('user clicks on the knative service {string}', (serviceName: string) => {
  topologyPage.verifyUserIsInGraphView();
  topologyPage.clickOnKnativeService(serviceName);
});

Then('side bar is displayed with heading name as {string}', (serviceName: string) => {
  topologySidePane.verifyTitle(serviceName);
});

Then(
  'side bar is displayed with heading name same as knative service name {string}',
  (serviceName: string) => {
    topologySidePane.verifyTitle(serviceName);
  },
);

When('user clicks on the knative service name {string}', (serviceName: string) => {
  topologyPage.clickOnKnativeService(serviceName);
});

Then(
  'Name, Namespace, Labels, Annotations, Created at, Owner fields displayed in topology details',
  () => {
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyFieldInDetailsTab('Name');
    topologySidePane.verifyFieldInDetailsTab('Namespace');
    topologySidePane.verifyFieldInDetailsTab('Labels');
    topologySidePane.verifyFieldInDetailsTab('Annotations');
    topologySidePane.verifyFieldInDetailsTab('Created at');
    topologySidePane.verifyFieldInDetailsTab('Owner');
  },
);

Then('Pods, Revisions, Routes and Builds displayed in Resources section', () => {
  topologySidePane.selectTab('Resources');
  topologySidePane.verifySection('Pods');
  topologySidePane.verifySection('Revisions');
  topologySidePane.verifySection('Routes');
  topologySidePane.verifySection('Builds');
});

Then('Pods, Revisions and Routes displayed in Resources section', () => {
  topologySidePane.selectTab('Resources');
  topologySidePane.verifySection('Pods');
  topologySidePane.verifySection('Revisions');
  topologySidePane.verifySection('Routes');
});

Then('Pods, Deployment, Routes and Configurations displayed in Resources section', () => {
  topologySidePane.selectTab('Resources');
  topologySidePane.verifySection('Pods');
  topologySidePane.verifySection('Deployment');
  topologySidePane.verifySection('Routes');
  topologySidePane.verifySection('Configurations');
});

When('user clicks on Actions dropdown in top right corner of side bar', () => {
  topologySidePane.clickActionsDropDown();
});

Then(
  'user able to see the options {string}, {string}, {string}, {string}',
  (op1, op2, op3, op4) => {
    topologySidePane.verifyActions(op1, op2, op3, op4);
  },
);

Then(
  'user able to see the options like {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}',
  (op1, op2, op3, op4, op5, op6, op7, op8, op9, op10) => {
    topologySidePane.verifyActions(op1, op2, op3, op4, op5, op6, op7, op8, op9, op10);
  },
);

When('user selects the {string} from Runtime Icon dropdown', (runTimeIcon: string) => {
  containerImagePage.selectRunTimeIcon(runTimeIcon);
});

When('user selects the application {string} from Application dropdown', (appName: string) => {
  containerImagePage.selectOrCreateApplication(appName);
});

Then(
  'user will see the deployed image {string} with {string} icon',
  (image: string, runTimeIcon: string) => {
    topologyPage.verifyWorkloadInTopologyPage(image);
    topologyPage.verifyRunTimeIconForContainerImage(runTimeIcon);
  },
);

When('user clicks on Resources tab', () => {
  topologySidePane.verifySelectedTab('Resources');
});

Then(
  'user able to see the {string}, {string}, {string}, {string} sections',
  (op1, op2, op3, op4) => {
    topologySidePane.verifySection(op1);
    topologySidePane.verifySection(op2);
    topologySidePane.verifySection(op3);
    topologySidePane.verifySection(op4);
  },
);
