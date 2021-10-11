import { pageTitle, operators, switchPerspective } from '../../constants';
import { devNavigationMenuPO, operatorsPO } from '../../pageObjects';
import { app, perspective, projectNameSpace, sidePane } from '../app';
import { operatorsPage } from '../operators-page';
import { installCRW, waitForCRWToBeAvailable } from './installCRW';
import { createKnativeEventing, createKnativeServing } from './knativeSubscriptions';

export const installOperator = (operatorName: operators) => {
  operatorsPage.navigateToOperatorHubPage();
  operatorsPage.searchOperator(operatorName);
  operatorsPage.selectOperator(operatorName);
  operatorsPage.verifySidePane();
  cy.get(operatorsPO.alertDialog).then(($sidePane) => {
    if ($sidePane.find(operatorsPO.sidePane.install).length) {
      cy.get(operatorsPO.sidePane.install).click({ force: true });
      cy.get(operatorsPO.installOperators.title).should('contain.text', pageTitle.InstallOperator);
      cy.get(operatorsPO.operatorHub.install).click();
      cy.get(operatorsPO.operatorHub.installingOperatorModal).should('be.visible');
      app.waitForLoad();
      operatorsPage.navigateToInstallOperatorsPage();
      operatorsPage.verifyInstalledOperator(operatorName);
    } else {
      cy.log(`${operatorName} Operator is already installed`);
      sidePane.close();
    }
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
      createKnativeEventing();
      createKnativeServing();
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

// If pipelines not available in left side navigation menu of developer navigation menu, then install from Operator Hub
export const verifyAndInstallPipelinesOperator = () => {
  perspective.switchTo(switchPerspective.Developer);
  app.waitForNameSpacesToLoad();
  app.waitForLoad();
  cy.get(devNavigationMenuPO.pageSideBar).then(($ele) => {
    if ($ele.find(devNavigationMenuPO.pipelines).length) {
      cy.log(`${operators.PipelinesOperator} operator is already installed in the cluster`);
    } else {
      perspective.switchTo(switchPerspective.Administrator);
      operatorsPage.navigateToInstallOperatorsPage();
      operatorsPage.searchOperatorInInstallPage(operators.PipelinesOperator);
      cy.get('body', {
        timeout: 50000,
      }).then(($body) => {
        if ($body.find(operatorsPO.installOperators.noOperatorsFound)) {
          installOperator(operators.PipelinesOperator);
          // After https://issues.redhat.com/browse/SRVKP-1379 issue fix, will remove below wait time
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(30000);
        }
      });
      perspective.switchTo(switchPerspective.Developer);
    }
  });
};

export const verifyAndInstallKnativeOperator = () => {
  perspective.switchTo(switchPerspective.Administrator);
  verifyAndInstallOperator(operators.ServerlessOperator);
};
