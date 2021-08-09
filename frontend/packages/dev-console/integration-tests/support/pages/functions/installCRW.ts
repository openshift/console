import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { operators, pageTitle } from '../../constants';
import { operatorsPO } from '../../pageObjects';
import { projectNameSpace } from '../app';
import { operatorsPage } from '../operators-page';

export const installCRW = () => {
  operatorsPage.navigateToInstallOperatorsPage();
  projectNameSpace.selectProject('openshift-workspaces');
  cy.get('body').then(($body) => {
    if ($body.find(operatorsPO.installOperators.search)) {
      cy.get(operatorsPO.installOperators.search)
        .should('be.visible')
        .clear()
        .type(operators.RedHatCodereadyWorkspaces);
    }
  });
  cy.get(operatorsPO.installOperators.checlusterCRLink)
    .should('be.visible')
    .click();
  cy.get(operatorsPO.installOperators.title).should(
    'contain.text',
    pageTitle.RedHatCodeReadyWorkspaces,
  );
  // Make sure the page is properly loaded
  cy.get('.loading-box__loaded')
    .should('be.visible')
    .within(() => {
      cy.get('.loading-box__loaded').should('be.visible');
    });
  cy.get('body').then(($body) => {
    if ($body.find('[role="grid"]').length) {
      cy.log(`${pageTitle.RedHatCodeReadyWorkspaces} already installed.`);
    } else {
      cy.byTestID('item-create').click();
      detailsPage.titleShouldContain(pageTitle.CreateChecluster);
      cy.byTestID('create-dynamic-form').click();
    }
  });
};
export const waitForCRWToBeAvailable = () => {
  operatorsPage.navigateToInstallOperatorsPage();
  projectNameSpace.selectProject('openshift-workspaces');
  cy.get(operatorsPO.installOperators.checlusterCRLink)
    .should('be.visible')
    .click();
  cy.get(operatorsPO.installOperators.title).should(
    'contain.text',
    pageTitle.RedHatCodeReadyWorkspaces,
  );
  cy.byTestOperandLink('codeready-workspaces')
    .should('be.visible')
    .click();
  cy.get(`[data-test-selector="details-item-value__Status"]`, { timeout: 900000 }).should(
    'include.text',
    'Available',
  );
};
