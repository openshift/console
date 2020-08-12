import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add_page';
import { topologyPage, topologySidePane } from '../../pages/topology_page';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';

let gitUrl = 'https://github.com/sclorg/nodejs-ex.git';
// let appName = '';

Given('topology has application name with node name {string}', (componentName: string) => {
  // cy.byLegacyTestID('topology-header').click();
  // cy.byLegacyTestID('topology-header').should('be.visible');
  // cy.get('body div', {timeout: 5000}).then(($el) => {
  //   if($el.find('div.ocs-page-layout__header').length !== 0) {
      // appName = componentName;
      naviagteTo(devNavigationMenu.Add);
      addPage.createGitWorkload(gitUrl, componentName);
      topologyPage.verifyTopologyPage();
  //   }
  //   else {
  //     topologyPage.verifyTopologyPage();
  //   }
  // });
});

When('user clicks on an applicaton grouping', () => {
  topologyPage.appNode('nodejs-ex-git-app').should('be.visible').click({force: true});
});

When('user right click on Application to open context menu', () => {
  topologyPage.appNode('nodejs-ex-git-app').trigger('contextmenu', {force: true});
  // .invoke('show').should('be.visible').invoke('trigger', 'contextmenu');
});

Then('user can see application sidebar', () => {
  topologySidePane.verify();
});

Then('user can confirm the workload information present under resources in the sidebar', () => {
  topologySidePane.verifyWorkload();
}); 

Then('user can see Add to Application and Delete Application in the Action menu', () => {
  topologySidePane.verify();
  cy.byLegacyTestID('actions-menu-button').click();
  topologySidePane.verifyActions('Add to Application', 'Delete Application');
});

Then('user can view Add to Application and Delete Application options', () => {
    topologyPage.verifyContextMenuOptions('Add to Application', 'Delete Application');
});
