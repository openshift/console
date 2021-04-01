import { operatorsPage } from '../operators-page';
import { operators, switchPerspective } from '../../constants/global';
import { operatorsPO } from '../../pageObjects/operators-po';
import { app, perspective } from '../app';
import { devNavigationMenuPO } from '../../pageObjects/global-po';
import { pageTitle } from '../../constants/pageTitle';
import { topologySidePane } from '../topology/topology-side-pane-page';

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
      topologySidePane.close();
    }
  });
};

export const verifyAndInstallPipelinesOperator = () => {
  perspective.switchTo(switchPerspective.Developer);
  app.waitForLoad();
  cy.get(devNavigationMenuPO.pageSideBar).then(($ele) => {
    if ($ele.find(devNavigationMenuPO.pipelines).length) {
      cy.log(`${operators.PipelineOperator} operator is already installed in the cluster`);
    } else {
      perspective.switchTo(switchPerspective.Administrator);
      operatorsPage.navigateToInstallOperatorsPage();
      cy.get(operatorsPO.installOperators.search).type(operators.PipelineOperator);
      cy.get('body', {
        timeout: 50000,
      }).then(($body) => {
        if ($body.find(operatorsPO.installOperators.noOperatorsFound)) {
          installOperator(operators.PipelineOperator);
        }
      });
      perspective.switchTo(switchPerspective.Developer);
    }
  });
};
