import { operators } from '@console/dev-console/integration-tests/support/constants/global';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects/operators-po';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { projectNameSpace } from '@console/dev-console/integration-tests/support/pages/app';
import { pageTitle } from '../../constants';

export const createKnativeServing = () => {
  projectNameSpace.selectProject('knative-serving');
  cy.get('body').then(($body) => {
    if ($body.find(operatorsPO.installOperators.search)) {
      cy.get(operatorsPO.installOperators.search)
        .should('be.visible')
        .clear()
        .type(operators.ServerlessOperator);
    }
  });
  cy.get(operatorsPO.installOperators.knativeServingLink)
    .should('be.visible')
    .click();
  detailsPage.titleShouldContain(pageTitle.KnativeServings);
  cy.get('body').then(($body) => {
    if ($body.find('[role="grid"]').length > 0) {
      cy.log(`${pageTitle.KnativeServings} already subscribed`);
    } else {
      cy.byTestID('item-create').click();
      detailsPage.titleShouldContain(pageTitle.CreateKnativeServing);
      cy.byTestID('create-dynamic-form').click();
    }
  });
};

export const createKnativeEventing = () => {
  projectNameSpace.selectProject('knative-eventing');
  cy.get('body').then(($body) => {
    if ($body.find(operatorsPO.installOperators.search)) {
      cy.get(operatorsPO.installOperators.search)
        .should('be.visible')
        .clear()
        .type(operators.ServerlessOperator);
    }
  });
  cy.get(operatorsPO.installOperators.knativeEventingLink)
    .should('be.visible')
    .click();
  detailsPage.titleShouldContain(pageTitle.KnativeEventings);
  cy.get('body').then(($body) => {
    if ($body.find('[role="grid"]').length > 0) {
      cy.log(`${pageTitle.KnativeEventings} already subscribed`);
    } else {
      cy.byTestID('item-create').click();
      detailsPage.titleShouldContain(pageTitle.CreateKnativeEventing);
      cy.byTestID('create-dynamic-form').click();
    }
  });
};
