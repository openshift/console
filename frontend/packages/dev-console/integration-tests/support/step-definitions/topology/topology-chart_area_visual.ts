import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { projectNameSpace, naviagteTo } from '../../pages/app';
import { addPage } from '../../pages/add_page';
import { topologyPage } from '../../pages/topology_page';
import { devNavigationMenu } from '../../constants/global';

Given('deployment workload is present in topology', () => {
  projectNameSpace.createNewProject('aut-topology-deployment-project');
  addPage.createGitWorkload();
  naviagteTo(devNavigationMenu.Topology);
});

Given('deployment-config workload is present in topology', () => {
  // TODO: implement step
});

Given('knative workload without revision is present in topology', () => {
  // TODO: implement step
});

Given('knative workload with revison is present in topology', () => {
  // TODO: implement step
});

Given('topology has workloads', () => {
  projectNameSpace.createNewProject('aut-topology-workloads');
  addPage.createGitWorkload();
});

When('user creates a new project', () => {
  projectNameSpace.createNewProject('aut-topology-new-project');
});

When('user selects an existing project from project list with existing workloads', () => {
  projectNameSpace.createNewProject('aut-topology-existing-project');
  addPage.createGitWorkload();
  projectNameSpace.selectProject('aut-topology-existing-project');
});

When('user checks nodes and the decorators associated with them', () => {
  // TODO: implement step
});

When('user right clicks on the node', () => {
  topologyPage.appNode('nodejs-ex-git-app').trigger('contextmenu', {force: true});
});

When('user clicks on Zoom In option', () => {
  // TODO: implement step
});

When('user clicks on Zoom Out option', () => {
  // TODO: implement step
});

When('user sees the chart area is zoomed', () => {
  // TODO: implement step
});

When('user clicks on Fit to Screen option', () => {
  // TODO: implement step
});

When('user clicks on Reset View option', () => {
  // TODO: implement step
});

Then('user sees Topology page with message on the top {string}', (message: string) => {
  topologyPage.verifyNoWorkLoadsText(message);
});

Then('user sees different workloads in topology chart area', () => {
  topologyPage.verifyWorkLoads();
});

Then('nodes are circular shaped with builder image in them', () => {
  // TODO: implement step
});

Then('pod ring associated with node are present around node with color according to the pod status', () => {
  // TODO: implement step
});

Then('deployment can have application url on top-right of the node', () => {
  // TODO: implement step
});

Then('user sees edit source code decorator is on bottom right of the node which can lead to github or che workspace', () => {
  // TODO: implement step
});

Then('user sees build decorator on bottom left which will take user to either build tab or pipeline depending on pipeline associated with them', () => {
  // TODO: implement step
});

Then('user checks node label having {string} for deployment and then name of node', (a: string) => {
 cy.log(a)
});

Then('deployment-config can have application url on top-right of the node', () => {
  // TODO: implement step
});

Then('user checks node label having {string} for deployment-config and then name of node', (a: string) => {
 cy.log(a)
});

Then('user can view knative service are rectangular shaped with round corners', () => {
  // TODO: implement step
});

Then('user can see dotted boundary with text {string} mentioned', (a: string) => {
 cy.log(a)
});

Then('knative sevice app can have application url on top-right of the node', () => {
  // TODO: implement step
});

Then('user sees build decorator on bottom left on knative service app which will take user to build tab', () => {
  // TODO: implement step
});

Then('user checks knative service having label {string} and then the name of service', (a: string) => {
 cy.log(a)
});

Then('user can see knative service app with dotted boundary with revision present inside it', () => {
  // TODO: implement step
});

Then('user can see traffic distribution from knative sevice app to its revisions with its percentage number', () => {
  // TODO: implement step
});

Then('pod ring associated with revisions are present around node with color according to the pod status', () => {
  // TODO: implement step
});

Then('knative revision can have application url on top-right of the node', () => {
  // TODO: implement step
});

Then('user sees edit source code decorator is on bottom right of the revision which can lead to github or che workspace', () => {
  // TODO: implement step
});

Then('user sees build decorator on bottom left on knative service app which will take user to either build tab', () => {
  // TODO: implement step
});

Then('user checks revisions having label {string} and then the name', (a: string) => {
 cy.log(a)
});

Then('user sees context menu', () => {
  topologyPage.verifyContextMenuOptions('Add to Application', 'Delete Application');
});

Then('user sees the chart area is zoomed', () => {
  // TODO: implement step
});

Then('user sees the chart area is zoomed out', () => {
  // TODO: implement step
});

Then('user sees the nodes fitting within chart area', () => {
  // TODO: implement step
});

Then('user sees the chart area is reset to original', () => {
  // TODO: implement step
});
