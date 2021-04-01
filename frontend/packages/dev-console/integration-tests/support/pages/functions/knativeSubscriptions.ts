import { operatorsPage } from '@console/dev-console/integration-tests/support/pages/operators-page';
import { operators } from '@console/dev-console/integration-tests/support/constants/global';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects/operators-po';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { projectNameSpace } from '@console/dev-console/integration-tests/support/pages/app';

export const createKnativeServing = () => {
  operatorsPage.navigateToInstallOperatorsPage();
  projectNameSpace.selectProject('knative-serving');
  operatorsPage.searchOperator(operators.ServerlessOperator);
  cy.get(operatorsPO.installOperators.knativeServingLink)
    .should('be.visible')
    .click();
  cy.get(operatorsPO.installOperators.title).should('contain.text', 'Red Hat OpenShift Serverless');
  cy.byTestID('item-create').click();
  detailsPage.titleShouldContain('Create Knative Serving');
  cy.byTestID('create-dynamic-form').click();
};

export const createKnativeEventing = () => {
  operatorsPage.navigateToInstallOperatorsPage();
  projectNameSpace.selectProject('knative-eventing');
  operatorsPage.searchOperator(operators.ServerlessOperator);
  cy.get(operatorsPO.installOperators.knativeEventingLink)
    .should('be.visible')
    .click();
  cy.get(operatorsPO.installOperators.title).should('contain.text', 'Red Hat OpenShift Serverless');
  cy.byTestID('item-create').click();
  detailsPage.titleShouldContain('Create Knative Eventing');
  cy.byTestID('create-dynamic-form').click();
};
