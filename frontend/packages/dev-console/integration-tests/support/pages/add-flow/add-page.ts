import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { addOptions } from '../../constants/add';
import { addPageItemsPO, cardTitle } from '../../pageObjects/add-flow-po';
import { app } from '../app';

export const addPage = {
  // TODO: Use PascalCase for enums and enforce them (remove "| string" here)
  selectCardFromOptions: (addOption: addOptions) => {
    app.waitForDocumentLoad();

    // TODO: try to remove this pipeline workaround later
    if (addOption === addOptions.Pipeline) {
      cy.wait(3000);
    }

    const addPageItem = addPageItemsPO[addOption];
    if (!addPageItem) {
      throw new Error(`Unable to find the "${addOption}" option on Add page`);
    }

    cy.byTestID(`item ${addPageItem.itemId}`)
      .should('be.visible')
      // force is required here because the add page moves dom components
      // from one column to another when the addtional cards are added
      // after checking the card conditions.
      .click({ force: true });

    app.waitForLoad();

    if (addPageItem.alternativePageTitleSelector) {
      cy.get(addPageItem.alternativePageTitleSelector).should(
        'have.text',
        addPageItem.verifyPageTitle,
      );
    } else {
      detailsPage.titleShouldContain(addPageItem.verifyPageTitle);
    }
    if (addPageItem.extraShouldBeVisibleSelector) {
      cy.get(addPageItem.extraShouldBeVisibleSelector).should('be.visible');
    }
    if (!addPageItem.skipA11yCheck) {
      cy.testA11y(`${addPageItem.verifyPageTitle} page`);
    }
  },
  verifyCard: (cardName: string) => cy.get(cardTitle).should('contain.text', cardName),
  setBuildEnvField: (envKey: string, value: string) =>
    cy
      .get(`#form-input-image-imageEnv-${envKey}-field`)
      .scrollIntoView()
      .should('be.visible')
      .clear()
      .type(value),
};

export const verifyAddPage = {
  verifyAddPageCard: (addOption: addOptions) => {
    app.waitForDocumentLoad();

    const addPageItem = addPageItemsPO[addOption];
    if (!addPageItem) {
      throw new Error(`Unable to find the "${addOption}" option on Add page`);
    }

    cy.byTestID(`item ${addPageItem.itemId}`).should('be.visible');
  },
};
