import { modal } from '@console/cypress-integration-tests/views/modal';
import { pageTitle, operators, switchPerspective } from '../../constants';
import { operatorsPO } from '../../pageObjects';
import { app, perspective, projectNameSpace, sidePane } from '../app';
import { operatorsPage } from '../operators-page';
import { installCRW, waitForCRWToBeAvailable } from './installCRW';
import { createKnativeEventing, createKnativeServing } from './knativeSubscriptions';

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
      cy.get(operatorsPO.operatorHub.install).click();
      cy.get(operatorsPO.operatorHub.installingOperatorModal).should('be.visible');
      app.waitForLoad();
      cy.byTestID('success-icon').should('be.visible');
      // Added below cy.request to verify the pipelines subscriptions
      if (operatorName === operators.PipelinesOperator) {
        cy.request(
          'api/kubernetes/apis/operators.coreos.com/v1alpha1/namespaces/openshift-operators/subscriptions/openshift-pipelines-operator-rh',
        ).then((resp) => {
          expect(resp.status).toEqual(200);
        });
      }
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

const performPostInstallationSteps = (operator: operators): void => {
  switch (operator) {
    case operators.ServerlessOperator:
      cy.log(`Performing Serverless post installation steps`);
      createKnativeServing();
      createKnativeEventing();
      break;
    case operators.RedHatCodereadyWorkspaces:
      cy.log(`Performing CRW post-installation steps`);
      installCRW();
      waitForCRWToBeAvailable();
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
  installOperator(operators.ServerlessOperator);
  performPostInstallationSteps(operators.ServerlessOperator);
};

export const verifyAndInstallGitopsPrimerOperator = () => {
  perspective.switchTo(switchPerspective.Administrator);
  verifyAndInstallOperator(operators.GitopsPrimer);
};
