import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';
import { switchPerspective, devNavigationMenu } from '../../constants';
import { perspective, navigateTo } from '../../pages';

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyTopologyPage();
});

When('user applies cronjob YAML', () => {
  cy.exec(`oc apply -f testData/yamls/create-cronjob.yaml`);
});

Then('user will see cron job with name {string} on topology page', (name: string) => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
  topologyPage.verifyWorkloadInTopologyPage(`${name}`);
});

When('user applies job YAML', () => {
  cy.exec(`oc apply -f testData/yamls/create-job.yaml`);
});

Then('user will see job with name {string} on topology page', (name: string) => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
  topologyPage.verifyWorkloadInTopologyPage(`${name}`);
});

When('user applies pod YAML', () => {
  cy.exec(`oc apply -f testData/yamls/create-pod.yaml`);
});

Then('user will see pod with name {string} on topology page', (name: string) => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
  topologyPage.verifyWorkloadInTopologyPage(`${name}`);
});
