import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import {
  app,
  gitPage,
  navigateTo,
  yamlEditor,
} from '@console/dev-console/integration-tests/support/pages';
import { chartAreaPO } from '../../page-objects/chart-area-po';
import { topologyPO } from '../../page-objects/topology-po';
import { topologyHelper, topologyPage } from '../topology';

export const verifyMultipleWorkloadInTopologyPage = (workloadNames: string[]) => {
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < workloadNames.length; i++) {
    const name = workloadNames[i];
    topologyHelper.search(name);
    topologyPage.verifyUserIsInGraphView();
    cy.get(topologyPO.graph.fitToScreen).click();
    cy.get(topologyPO.highlightNode).should('be.visible');
    app.waitForDocumentLoad();
  }
};

export const createWorkloadUsingOptions = (optionName: string, optionalData?: string) => {
  switch (optionName) {
    case 'Go Sample':
      cy.get(chartAreaPO.submitButton)
        .should('be.enabled')
        .click();
      break;

    case 'Import From Git':
      gitPage.enterGitUrl('https://github.com/sclorg/nodejs-ex.git');
      gitPage.verifyValidatedMessage('https://github.com/sclorg/nodejs-ex.git');
      gitPage.enterComponentName('nodejs-ex-git');
      gitPage.selectResource('Deployment');
      gitPage.enterAppName('nodejs-ex-git-app');
      cy.get(chartAreaPO.submitButton).click();
      break;

    case 'Container Image':
      cy.get(chartAreaPO.deployImage)
        .clear()
        .type('openshift/hello-openshift');
      cy.get(chartAreaPO.validationText).should('have.text', 'Validated');
      cy.get(chartAreaPO.submitButton).click();
      break;

    case 'Catalog':
      cy.get(chartAreaPO.gitInputURL).type('https://github.com/sclorg/nodejs-ex.git');
      gitPage.verifyValidatedMessage('https://github.com/sclorg/nodejs-ex.git');
      gitPage.enterComponentName('python-app');
      gitPage.selectResource('Deployment');
      gitPage.enterAppName('nodejs-ex-git-app');
      cy.get(chartAreaPO.submitButton).click();
      break;

    case 'Operator Backed':
      cy.get(chartAreaPO.yamlView).click();
      yamlEditor.isLoaded();
      cy.get(chartAreaPO.yamlEditor)
        .click()
        .focused()
        .type('{ctrl}a')
        .clear();

      // eslint-disable-next-line no-case-declarations
      const yamlLocation = `support/${optionalData}`;
      yamlEditor.setEditorContent(yamlLocation);
      cy.get(chartAreaPO.saveChanges).click();
      cy.get('[aria-label="Breadcrumb"]').should('contain', 'PostgresCluster details');
      navigateTo(devNavigationMenu.Topology);
      break;

    case 'Helm Chart':
      cy.get(chartAreaPO.helmReleaseName)
        .clear()
        .type('helm-nodejs');
      cy.get(chartAreaPO.submitButton).click();
      break;

    case 'Event Source':
      cy.get(chartAreaPO.eventName).type('v11');
      cy.get(chartAreaPO.eventValue).type('kind');
      cy.get(chartAreaPO.submitButton).click();
      break;

    case 'Channel':
      cy.get(chartAreaPO.channelName).should('have.value', 'channel');
      cy.get(chartAreaPO.submitButton).click();
      break;

    default:
      break;
  }
};

export const addToProjectOptions = (optionName: string) => {
  switch (optionName) {
    case 'Import from Git':
      cy.get(chartAreaPO.importFromGit).click();
      break;
    case 'Container Image':
      cy.get(chartAreaPO.containerImage).click();
      break;
    case 'From Catalog':
      cy.get(chartAreaPO.catalog).click();
      break;
    case 'Database':
      cy.get(chartAreaPO.database).click();
      break;
    case 'Operator Backed':
      cy.get(chartAreaPO.operatorBacked).click();
      break;
    case 'Helm Charts':
      cy.get(chartAreaPO.helmCharts).click();
      break;
    case 'Event Source':
      cy.get(chartAreaPO.eventsource).click();
      break;
    case 'Channel':
      cy.get(chartAreaPO.channel).click();
      break;
    default:
      break;
  }
};
