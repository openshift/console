import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { addOptions } from '../../constants/add';
import { devNavigationMenu } from '../../constants/global';
import { topologyPO } from '../../pageObjects';
import { addPage, gitPage } from '../add-flow';
import { app, createForm, navigateTo } from '../app';

export const createBroker = (brokerName: string = 'broker-one') => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.Broker);
  cy.get('#form-radiobutton-editorType-form-field').click();
  gitPage.enterWorkloadName(brokerName);
  createForm.clickCreate().then(() => {
    app.waitForLoad();
    cy.log(`Broker "${brokerName}" is created`);
  });
};

export const createBrokerIfNotExistsOnTopologyPage = (brokerName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.waitForLoad();
  cy.get('body').then(($body) => {
    if ($body.find(topologyPO.emptyStateIcon).length) {
      navigateTo(devNavigationMenu.Add);
      createBroker(brokerName);
      topologyPage.verifyWorkloadInTopologyPage(brokerName);
    } else {
      topologyPage.search(brokerName);
      cy.get('body').then(($node) => {
        if ($node.find(topologyPO.highlightNode).length) {
          cy.log(`Broker Name: "${brokerName}" is already available`);
        } else {
          navigateTo(devNavigationMenu.Add);
          createBroker(brokerName);
          topologyPage.verifyWorkloadInTopologyPage(brokerName);
        }
      });
    }
  });
};
