import { app, topologySidePane } from '@console/dev-console/integration-tests/support/pages';
import { editDeployment } from '@console/topology/integration-tests/support/pages/topology/topology-edit-deployment';
import { hpaPO } from '../../page-objects/hpa-po';
import { topologyPO } from '../../page-objects/topology-po';

export const addSecret = (
  secretName: string = 'newSecret 1',
  serverUrl: string = 'https://quay.io/repository/kubernetes-ingress-controller/nginx-ingress-controller?tag=latest&tab=tags',
  username: string = 'test1',
  password: string = 'test',
  email: string = 'test1@redhat.com',
) => {
  editDeployment.verifyModalTitle();
  editDeployment.addSecretName(secretName);
  editDeployment.addServerAddress(serverUrl);
  editDeployment.enterUsername(username);
  editDeployment.enterPassword(password);
  editDeployment.enterEmail(email);
  editDeployment.saveSecret();
};

export const checkPodsText = (tries: number = 10) => {
  if (tries < 1) {
    return;
  }
  // eslint-disable-next-line promise/catch-or-return
  cy.get('body').then(($body) => {
    if (
      !$body
        .find(topologyPO.sidePane.podText)
        .text()
        .includes('1Pod')
    ) {
      cy.reload();
      app.waitForDocumentLoad();
      topologySidePane.selectTab('Details');
      cy.wait(15000);
      checkPodsText(tries - 1);
    } else {
      cy.get(topologyPO.sidePane.podText, { timeout: 120000 }).should('have.text', '1Pod');
    }
  });
};

export const checkPodsCount = (tries: number = 10) => {
  if (tries < 1) {
    return;
  }
  // eslint-disable-next-line promise/catch-or-return
  cy.get('body').then(($body) => {
    if ($body.find(hpaPO.nodeList).length === 0) {
      cy.reload();
      app.waitForDocumentLoad();
      cy.wait(15000);
      checkPodsCount(tries - 1);
    } else {
      cy.log('Found');
    }
  });
};
