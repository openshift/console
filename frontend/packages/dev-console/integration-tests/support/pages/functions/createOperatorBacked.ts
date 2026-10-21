import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions, pageTitle } from '../../constants';
import { formPO } from '../../pageObjects';
import { addPage, catalogPage } from '../add-flow';

export const createOperatorBacked = (
  operatorName: string = 'nodejs-ex-git',
  name: string = 'test123',
) => {
  addPage.selectCardFromOptions(addOptions.OperatorBacked);
  detailsPage.titleShouldContain(pageTitle.OperatorBacked);
  catalogPage.isCardsDisplayed();
  catalogPage.search(operatorName);
  catalogPage.verifySelectOperatorBackedCard(operatorName);
  catalogPage.verifyDialog();
  catalogPage.clickButtonOnCatalogPageSidePane();
  catalogPage.verifyCreateOperatorBackedPage(operatorName);
  catalogPage.enterOperatorBackedName(name);
  cy.get('[data-test="create-dynamic-form"]')
    .click()
    .then(() => {
      cy.get('.co-m-loader').should('not.exist');
      cy.get('body').then(($body) => {
        if ($body.find(formPO.errorAlert).length !== 0) {
          cy.get(formPO.errorAlert)
            .find('.co-pre-line')
            .then(($ele) => {
              cy.log($ele.text());
            });
        } else {
          cy.log(`Operator Backed Worload : "${name}" is created`);
        }
      });
    });
};
