import { operatorsPage } from '../operators-page';
import { pageTitle } from '../../constants/pageTitle';
import { operators, switchPerspective } from '../../constants/global';
import { operatorsPO } from '../../pageObjects/operators-po';
import { app, perspective, sidePane } from '../app';
import { devNavigationMenuPO } from '../../pageObjects';

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
      operatorsPage.searchOperator(operators.PipelinesOperator);
      cy.get('body', {
        timeout: 50000,
      }).then(($body) => {
        if ($body.find(operatorsPO.installOperators.noOperatorsFound)) {
          installOperator(operators.PipelinesOperator);
        }
      });
      perspective.switchTo(switchPerspective.Developer);
    }
  });
};
