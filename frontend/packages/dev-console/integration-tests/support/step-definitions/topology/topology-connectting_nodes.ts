import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add_page';
import { topologyPage, topologySidePane } from '../../pages/topology_page';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';

let firstComponent = 'nodejs-ex-git';
let secondComponent = 'dancer-ex-git'

Given('topology has atleast two nodes', () => {
  addPage.createGitWorkload('https://github.com/sclorg/nodejs-ex.git', 'nodejs-ex-git-app', firstComponent);
  addPage.createGitWorkload('https://github.com/sclorg/dancer-ex.git', 'dancer-ex-git-app', secondComponent);
  naviagteTo(devNavigationMenu.Topology);
  topologyPage.componentNode(firstComponent).should('be.visible');
  topologyPage.componentNode(secondComponent).should('be.visible');
});

When('user opens sidebar of one of the node', () => {
  topologyPage.componentNode(firstComponent).click();
  topologySidePane.verify();
});

When('user opens action menu and selects {string} option', (actionMenuOption: string) => {
  topologySidePane.selectNodeAction(actionMenuOption);
});

When('user enters key as {string}', (key: string) => {
  cy.get('[data-test-id="pairs-list__add-btn"]').click();
  cy.get('input[placeholder="key"][value=""]').type(key);
});

When('user enters value as name of the node to which it will be associated', () => {
  cy.get('input[placeholder="value"][value=""]').type(secondComponent);
  cy.byTestID('confirm-action').click();
});

Then('user can see the arrow between two nodes', () => {
  cy.get('[data-test-id="edge-handler"]').should('be.visible');
});

When('user scrolls over a node to see the arrow', () => {
  // manual step
});

When('user click on the front of arrow and drag it on to the other node and drop it', () => {
  // manual step
});

Then('user can see the arrow connecting them with head pointing to the node where the arrow is dropped', () => {
  // manual step
});
