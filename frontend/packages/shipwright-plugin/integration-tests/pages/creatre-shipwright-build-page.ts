import { createShipwrightBuildPO } from '../support/pageObjects/build-po';

const pageTile = 'Create Shipwright Build';

export const createShipwrightBuildPage = {
  verifyTitle: () => {
    cy.get('[data-test="form-title"]').should('have.text', pageTile);
  },
  enterBuildName: (name: string) => {
    cy.get(createShipwrightBuildPO.nameField).clear();
    cy.get(createShipwrightBuildPO.nameField).type(name).should('have.value', name);
  },
  selectBuildStrategyOption: (buildStrategy: string) => {
    cy.get(createShipwrightBuildPO.buildStrategyDropdownField).scrollIntoView().click();
    cy.get(createShipwrightBuildPO.buildStrategyS2IOption).scrollIntoView().click();
    cy.log(`Build option "${buildStrategy}" is selected`);
  },
  enterBuilderImage: (builderImage: string) => {
    cy.get(createShipwrightBuildPO.builderImageField).clear();
    cy.get(createShipwrightBuildPO.builderImageField)
      .type(builderImage)
      .should('have.value', builderImage);
  },
  enterOutputImage: (outputImage: string) => {
    cy.get(createShipwrightBuildPO.outputImageField).clear();
    cy.get(createShipwrightBuildPO.outputImageField)
      .type(outputImage)
      .should('have.value', outputImage);
  },
};
