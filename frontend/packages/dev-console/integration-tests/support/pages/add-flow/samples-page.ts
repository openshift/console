import { samplesPO } from '../../pageObjects/add-flow-po';

export const samplesPage = {
  search: (keyword: string) => {
    cy.get('.skeleton-catalog--grid').should('not.exist');
    cy.get(samplesPO.search).clear().type(keyword);
  },
  selectCardInSamples: (card: string) => {
    cy.get('.skeleton-catalog--grid').should('not.exist');
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    switch (card) {
      case 'Httpd': {
        cy.get(samplesPO.cards.httpdTemplate).first().click();
        break;
      }
      case 'Basic Go': {
        cy.get(samplesPO.cards.basicgoTemplate).first().click();
        break;
      }
      default: {
        throw new Error(`${card} card is not available in Catalog`);
      }
    }
  },
};
