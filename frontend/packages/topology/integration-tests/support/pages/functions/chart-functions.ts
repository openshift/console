import { app, gitPage, yamlEditor } from '@console/dev-console/integration-tests/support/pages';
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

export const createWorkloadUsingOptions = (optionName: string) => {
  switch (optionName) {
    case 'Go Sample':
      gitPage.verifyValidatedMessage(
        'https://github.com/devfile-samples/devfile-sample-go-basic.git',
      );
      gitPage.enterComponentName('go-basic');
      gitPage.selectResource('Deployment');
      cy.get(chartAreaPO.gitInputURL).should('be.disabled');
      cy.get(chartAreaPO.gitForm)
        .contains('Show advanced Routing options')
        .click();
      cy.get(chartAreaPO.gitForm)
        .contains('Hide advanced Routing options')
        .click();
      gitPage.enterComponentName('go-basic');
      cy.get(chartAreaPO.submitButton).click();
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
      const yamlLocation = 'support/test-data/postgres-operator-backed.yaml';
      yamlEditor.setEditorContent(yamlLocation);
      cy.get(chartAreaPO.saveChanges).click();
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
