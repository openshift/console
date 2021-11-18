import { operators } from '@console/dev-console/integration-tests/support/constants/global';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects/operators-po';
import { app, projectNameSpace } from '@console/dev-console/integration-tests/support/pages/app';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { pageTitle } from '../../constants';

export const createKnativeServing = () => {
  projectNameSpace.selectProject('knative-serving');
  cy.get('body').then(($body) => {
    if ($body.find(operatorsPO.installOperators.search)) {
      cy.get(operatorsPO.installOperators.search)
        .clear()
        .type(operators.ServerlessOperator);
    }
  });
  cy.get(operatorsPO.installOperators.knativeServingLink).click({ force: true });
  cy.get('body').then(($body) => {
    if ($body.text().includes('Page Not Found')) {
      cy.reload();
    }
  });
  detailsPage.titleShouldContain(pageTitle.KnativeServings);
  app.waitForLoad();
  cy.get('body').then(($body) => {
    if ($body.find('[role="grid"]').length > 0) {
      cy.log(`${pageTitle.KnativeServings} already subscribed`);
    } else {
      cy.byTestID('item-create').click();
      detailsPage.titleShouldContain(pageTitle.CreateKnativeServing);
      cy.byTestID('create-dynamic-form').click();
      cy.byLegacyTestID('details-actions').should('be.visible');
      cy.contains(
        'DependenciesInstalled, DeploymentsAvailable, InstallSucceeded, Ready, VersionMigrationEligible',
        { timeout: 150000 },
      ).should('be.visible');
    }
  });
};

export const createKnativeEventing = () => {
  projectNameSpace.selectProject('knative-eventing');
  cy.get('body').then(($body) => {
    if ($body.find(operatorsPO.installOperators.search)) {
      cy.get(operatorsPO.installOperators.search)
        .clear()
        .type(operators.ServerlessOperator);
    }
  });
  cy.get(operatorsPO.installOperators.knativeEventingLink).click({ force: true });
  cy.get('body').then(($body) => {
    if ($body.text().includes('Page Not Found')) {
      cy.reload();
    }
  });
  detailsPage.titleShouldContain(pageTitle.KnativeEventings);
  app.waitForLoad();
  cy.get('body').then(($body) => {
    if ($body.find('[role="grid"]').length > 0) {
      cy.log(`${pageTitle.KnativeEventings} already subscribed`);
    } else {
      cy.byTestID('item-create').click();
      detailsPage.titleShouldContain(pageTitle.CreateKnativeEventing);
      cy.byTestID('create-dynamic-form').click();
      cy.byLegacyTestID('details-actions').should('be.visible');
      cy.contains(
        'DependenciesInstalled, DeploymentsAvailable, InstallSucceeded, Ready, VersionMigrationEligible',
        { timeout: 150000 },
      ).should('be.visible');
    }
  });
};
