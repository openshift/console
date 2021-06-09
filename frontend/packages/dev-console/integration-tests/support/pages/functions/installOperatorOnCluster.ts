import { operatorsPage } from '../operators-page';
import { pageTitle, operators, switchPerspective } from '../../constants';
import { devNavigationMenuPO, operatorsPO } from '../../pageObjects';
import { app, perspective, sidePane } from '../app';
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
      if (operatorName === operators.ServerlessOperator) {
        createKnativeEventing();
        createKnativeServing();
      }
    } else {
      cy.log(`${operatorName} Operator is already installed`);
      sidePane.close();
    }
  });
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
  installOperator(operators.ServerlessOperator);
};
