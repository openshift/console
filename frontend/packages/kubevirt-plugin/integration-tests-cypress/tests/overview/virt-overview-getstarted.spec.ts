import * as virtOverview from '../../views/virtualization-overview';

const EXIST = 'exist';
const NOT_EXIST = 'not.exist';

describe('Test Getting started card of the Virtualization Overview page', () => {
  before(() => {
    cy.Login();
    cy.visit('/virtualization/overview');
  });

  it('Getting started card is displayed', () => {
    cy.get(virtOverview.gettingStartedCard).should(EXIST);
  });

  it('Getting started card can be hidden', () => {
    cy.get(virtOverview.hideGettingStartedCardKebab).click();
    cy.get(virtOverview.hideGettingStartedCardTooltip).should(EXIST);
    cy.get(virtOverview.hideGettingStartedCardTooltip).click();

    cy.get(virtOverview.gettingStartedCard).should(NOT_EXIST);
  });

  it('Getting started card can be restored', () => {
    cy.get(virtOverview.restoreGettingStartedBtn).should(EXIST);
    cy.get(virtOverview.restoreGettingStartedBtn).click();
    cy.get(virtOverview.gettingStartedCard).should(EXIST);
  });

  it('Quick starts card is displayed', () => {
    cy.get(virtOverview.quickStartCard).should(EXIST);
  });

  it('Feature highlights card is displayed', () => {
    cy.get(virtOverview.featureHighlightsCard).should(EXIST);
  });

  it('Recommended operators card is displayed', () => {
    cy.get(virtOverview.recommendedOperatorsCard).should(EXIST);
  });
});
