import { testName } from '../../support';
import { TEMPLATE } from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import * as wizardView from '../../views/selector-wizard';
import { wizard } from '../../views/wizard';

describe('Import URL examples', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
    cy.visitVMsList();
  });

  after(() => {
    cy.visit('/');
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-7509) Examples of Import URLs for VM templates', () => {
    for (const [key, value] of Object.entries(TEMPLATE)) {
      if (key !== 'DEFAULT') {
        wizard.vm.open();
        cy.get('.pf-c-card')
          .contains(value.os)
          .should('exist')
          .click();
        cy.get(wizardView.next)
          .should('not.be.disabled')
          .click();
        cy.get('body').then(($body) => {
          if ($body.find('.ReactModal__Overlay').length > 0) {
            cy.get('#confirm-action').click();
          }
        });
        cy.get(wizardView.imageSourceDropdown).click();
        cy.get(wizardView.selectMenu)
          .contains(ProvisionSource.URL.getDescription())
          .click({ force: true });
        cy.get('.pf-c-form__helper-text')
          .contains('Example: ')
          .within(() => {
            cy.get('a').should('have.attr', 'href', value.exampleImgUrl);
          });
        cy.get(wizardView.imageSourceDropdown).click();
        cy.get(wizardView.selectMenu)
          .contains(ProvisionSource.REGISTRY.getDescription())
          .click({ force: true });
        if (value.exampleRegUrl) {
          cy.get('.pf-c-form__helper-text')
            .contains('Example: ')
            .contains(value.exampleRegUrl)
            .should('exist');
        }
        cy.get('button')
          .contains('Cancel')
          .click();
      }
    }
  });
});
