import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add_page';
import { topologyPage } from '../../pages/topology_page';

let firstComponent = 'nodejs-ex-git';
let secondComponent = 'dancer-ex-git';
let thirdComponent = 'dancer-ex-git-knative';


Given('topology has deployment,deployment-config and knative workloads', () => {
  addPage.createGitWorkload('https://github.com/sclorg/nodejs-ex.git', 'nodejs-ex-git-app', firstComponent, 'Deployment');
  addPage.createGitWorkload('https://github.com/sclorg/dancer-ex.git', 'dancer-ex-git-app', secondComponent, 'Deployment Config');
  addPage.createGitWorkload('https://github.com/sclorg/dancer-ex.git', 'dancer-ex-git-app', thirdComponent, 'Knative');
});

When('user clicks on Display Options on top of topology', () => {
  topologyPage.clicKDisplayOptionDropdown()
});

When('user sees {string} and {string} under {string} and {string} have options according to their presence which are {string} and {string}', (a: string, b: string, c: string, d: string, e: string, f: string) => {
  cy.log(a, b, c, d, e, f);
});

When('user deselect {string} which is selected by default', (a: string) => {
 cy.log(a)
});

When('user sees the labels under the workloads have dissapeared', () => {
  // TODO: implement step
});

When('user hover over application grouping the label appears', () => {
  // TODO: implement step
});

When('user select {string} which is deselected by default', (a: string) => {
 cy.log(a)
});

When('user checks the workloads which shows pod count instead of buider images', () => {
  // TODO: implement step
});

When('user deselect {string} in the Expand section', (a: string) => {
 cy.log(a)
});

Then('user can see workloads squashed in Application grouping', () => {
  // TODO: implement step
});

Then('user select {string} in the Expand section', (a: string) => {
 cy.log(a)
});

Then('user deselect {string} in the Expand section', (a: string) => {
 cy.log(a)
});

Then('user can see knative workload squashed in Application grouping', () => {
  // TODO: implement step
});
