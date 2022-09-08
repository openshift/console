import { modal } from '@console/cypress-integration-tests/views/modal';
import { pipelinesPage } from '@console/pipelines-plugin/integration-tests/support/pages';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { pageTitle, operators, switchPerspective } from '../../constants';
import { operatorsPO } from '../../pageObjects';
import { app, perspective, projectNameSpace, sidePane } from '../app';
import { operatorsPage } from '../operators-page';
import { installCRW, waitForCRWToBeAvailable } from './installCRW';
import {
  createKnativeEventing,
  createKnativeServing,
  createKnativeKafka,
} from './knativeSubscriptions';

export const installOperator = (operatorName: operators) => {
  operatorsPage.navigateToOperatorHubPage();
  operatorsPage.searchOperator(operatorName);
  operatorsPage.selectOperator(operatorName);
  cy.get('body').then(($body) => {
    if ($body.text().includes('Show community Operator')) {
      cy.log('Installing community operator');
      modal.submit();
      modal.shouldBeClosed();
    }
  });
  operatorsPage.verifySidePane();
  cy.get(operatorsPO.alertDialog).then(($sidePane) => {
    if ($sidePane.find(operatorsPO.sidePane.install).length) {
      cy.get(operatorsPO.sidePane.install).click({ force: true });
      cy.get(operatorsPO.installOperators.title).should('contain.text', pageTitle.InstallOperator);
      if (operatorName === operators.WebTerminalOperator) {
        cy.get(operatorsPO.warningAlert, { timeout: 3000 }).should('be.visible');
      }
      cy.get(operatorsPO.operatorHub.install).click();
      cy.get(operatorsPO.operatorHub.installingOperatorModal).should('be.visible');
      app.waitForLoad();

      // workaround for https://bugzilla.redhat.com/show_bug.cgi?id=2059865
      const waitForResult = (tries: number = 10) => {
        if (tries < 1) {
          return;
        }
        cy.wait(2000);
        cy.get('body').then((body) => {
          if (body.find(`[data-test="success-icon"]`).length > 0) {
            cy.byTestID('success-icon').should('be.visible');
          } else if (body.find(`.pf-c-alert`).length > 0) {
            cy.log('Installation flow interrupted, check the Installed Operators page for status');
            operatorsPage.navigateToInstallOperatorsPage();
            operatorsPage.searchOperatorInInstallPage(operatorName);
            cy.contains('Succeeded', { timeout: 300000 });
          } else {
            waitForResult(tries - 1);
          }
        });
      };
      waitForResult();
    } else {
      cy.log(`${operatorName} Operator is already installed`);
      sidePane.close();
    }
    operatorsPage.navigateToInstallOperatorsPage();
    operatorsPage.verifyInstalledOperator(operatorName);
  });
};

// Conditional wait (recursive).
// Installs operator if it's not installed.
// Needs to be done this way, beacuse the operators list is not updated quickly enough after filtering.
const installIfNotInstalled = (operator: operators, tries: number = 4, polling: number = 500) => {
  if (tries === 0) {
    cy.log(`Operator ${operator} is already installed.`);
    return;
  }
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound).length) {
      cy.log(`Operator ${operator} was not yet installed.`);
      installOperator(operator);
    } else {
      // "No operators found" element was not found. Wait and try again.
      cy.wait(polling);
      installIfNotInstalled(operator, tries - 1, polling);
    }
  });
};

export const waitForCRDs = (operator: operators) => {
  switch (operator) {
    case operators.PipelinesOperator:
      cy.log(`Verify the CRD's for the "${operator}"`);
      operatorsPage.navigateToCustomResourceDefinitions();
      cy.byTestID('name-filter-input')
        .clear()
        .type('Pipeline');
      cy.get('tr[data-test-rows="resource-row"]', { timeout: 300000 }).should(
        'have.length.within',
        4,
        6,
      );
      cy.get('[data-test-id="TektonPipeline"]', { timeout: 80000 }).should('be.visible');
      cy.get('[data-test-id="PipelineResource"]', { timeout: 80000 }).should('be.visible');
      cy.get('[data-test-id="PipelineRun"]', { timeout: 80000 }).should('be.visible');
      cy.get('[data-test-id="Pipeline"]', { timeout: 80000 }).should('be.visible');
      break;

    case operators.WebTerminalOperator:
      cy.log(`Verify the CRD's for the "${operator}"`);
      operatorsPage.navigateToCustomResourceDefinitions();
      cy.byTestID('name-filter-input')
        .clear()
        .type('DevWorkspace');
      cy.get('tr[data-test-rows="resource-row"]', { timeout: 300000 }).should(
        'have.length.within',
        4,
        6,
      );
      cy.get('[data-test-id="DevWorkspace"]', { timeout: 80000 }).should('be.visible');
      cy.get('[data-test-id="DevWorkspaceOperatorConfig"]', { timeout: 80000 }).should(
        'be.visible',
      );
      cy.get('[data-test-id="DevWorkspaceRouting"]', { timeout: 80000 }).should('be.visible');
      cy.get('[data-test-id="DevWorkspaceTemplate"]', { timeout: 80000 }).should('be.visible');
      break;
    default:
      cy.log(`waiting for CRC's is not applicable for this ${operator} operator`);
  }
};

const waitForPipelineTasks = (retries: number = 30) => {
  if (retries === 0) {
    return;
  }
  cy.contains('h1', 'Pipeline builder').should('be.visible');
  cy.byTestID('loading-indicator').should('not.exist');
  cy.wait(500);
  cy.get('body').then(($body) => {
    if ($body.find(`[data-id="pipeline-builder"]`).length === 0) {
      cy.wait(10000);
      cy.reload();
      waitForPipelineTasks(retries - 1);
    }
  });
};

const createShipwrightBuild = () => {
  projectNameSpace.selectProject(Cypress.env('NAMESPACE'));
  cy.get('body').then(($body) => {
    if ($body.find(operatorsPO.installOperators.search)) {
      cy.get(operatorsPO.installOperators.search)
        .clear()
        .type(operators.ShipwrightOperator);
    }
  });
  cy.get(operatorsPO.installOperators.shipwrightBuildLink).click({ force: true });
  cy.get('body').then(($body) => {
    if ($body.text().includes('Page Not Found')) {
      cy.reload();
    }
  });
  detailsPage.titleShouldContain(pageTitle.ShipwrightBuild);
  app.waitForLoad();
  cy.get('body').then(($body) => {
    if ($body.find('[role="grid"]').length > 0) {
      cy.log(`${pageTitle.ShipwrightBuild} already subscribed`);
    } else {
      cy.byTestID('item-create').click();
      detailsPage.titleShouldContain(pageTitle.ShipwrightBuild);
      cy.byTestID('create-dynamic-form').click();
      cy.byLegacyTestID('details-actions').should('be.visible');
      cy.contains('Ready', { timeout: 150000 }).should('be.visible');
    }
  });
};

const performPostInstallationSteps = (operator: operators): void => {
  switch (operator) {
    case operators.ServerlessOperator:
      cy.log(`Performing Serverless post installation steps`);
      createKnativeServing();
      createKnativeEventing();
      createKnativeKafka();
      operatorsPage.navigateToOperatorHubPage();
      break;
    case operators.RedHatCodereadyWorkspaces:
      cy.log(`Performing CRW post-installation steps`);
      installCRW();
      waitForCRWToBeAvailable();
      break;
    case operators.PipelinesOperator:
      cy.log(`Performing Pipelines post-installation steps`);
      cy.request(
        'api/kubernetes/apis/operators.coreos.com/v1alpha1/namespaces/openshift-operators/subscriptions/openshift-pipelines-operator-rh',
      ).then((resp) => {
        expect(resp.status).toEqual(200);
      });
      waitForCRDs(operators.PipelinesOperator);
      cy.visit('/pipelines/ns/default');
      pipelinesPage.clickOnCreatePipeline();
      waitForPipelineTasks();
      break;
    case operators.WebTerminalOperator:
      cy.log(`Performing Web Terminal post-installation steps`);
      waitForCRDs(operators.WebTerminalOperator);
      break;
    case operators.ShipwrightOperator:
      cy.log(`Performing Shipwright Operator post-installation steps`);
      createShipwrightBuild();
      break;
    default:
      cy.log(`Nothing to do in post-installation steps`);
  }
};

export const verifyAndInstallOperator = (operator: operators, namespace?: string) => {
  cy.log(`Installing operator: "${operator}"`);
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  if (namespace !== undefined) {
    projectNameSpace.selectProjectOrDoNothing(namespace);
  }
  operatorsPage.searchOperatorInInstallPage(operator);

  installIfNotInstalled(operator);
  performPostInstallationSteps(operator);
};

export const verifyAndInstallPipelinesOperator = () => {
  perspective.switchTo(switchPerspective.Administrator);
  verifyAndInstallOperator(operators.PipelinesOperator);
};

export const verifyAndInstallKnativeOperator = () => {
  perspective.switchTo(switchPerspective.Administrator);
  verifyAndInstallOperator(operators.ServerlessOperator);
};

export const verifyAndInstallGitopsPrimerOperator = () => {
  perspective.switchTo(switchPerspective.Administrator);
  verifyAndInstallOperator(operators.GitopsPrimer);
};

export const verifyAndInstallWebTerminalOperator = () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  cy.get(operatorsPO.installOperators.search)
    .should('be.visible')
    .clear()
    .type(operators.WebTerminalOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.WebTerminalOperator);
      operatorsPage.navigateToInstallOperatorsPage();
      operatorsPage.searchOperatorInInstallPage('DevWorkspace Operator');
      cy.get('.co-clusterserviceversion-logo__name__clusterserviceversion').should(
        'include.text',
        'DevWorkspace Operator',
      );
      cy.contains('Succeeded', { timeout: 300000 });
      performPostInstallationSteps(operators.WebTerminalOperator);
    } else {
      cy.log('Web Terminal operator is installed in cluster');
    }
  });
};
