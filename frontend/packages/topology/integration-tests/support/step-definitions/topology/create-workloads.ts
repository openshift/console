import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
import { perspective, topologyPage } from '@console/dev-console/integration-tests/support/pages';

When('user applies cronjob YAML', () => {
  cy.exec(`oc apply -f testData/yamls/create-cronjob.yaml`);
});

Then('user will see cron job with name {string} on topology page', (name: string) => {
  perspective.switchTo(switchPerspective.Developer);
  topologyPage.verifyWorkloadInTopologyPage(`${name}`);
});

When('user applies job YAML', () => {
  cy.exec(`oc apply -f testData/yamls/create-job.yaml`);
});

Then('user will see job with name {string} on topology page', (name: string) => {
  perspective.switchTo(switchPerspective.Developer);
  topologyPage.verifyWorkloadInTopologyPage(`${name}`);
});

When('user applies pod YAML', () => {
  cy.exec(`oc apply -f testData/yamls/create-pod.yaml`);
});

Then('user will see pod with name {string} on topology page', (name: string) => {
  perspective.switchTo(switchPerspective.Developer);
  topologyPage.verifyWorkloadInTopologyPage(`${name}`);
});
