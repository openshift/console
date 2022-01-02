import { adminOnlyDescribe } from '../../utils/const';
import * as virtOverview from '../../views/virtualization-overview';

const EXIST = 'exist';
const NOT_EXIST = 'not.exist';

adminOnlyDescribe('Test Getting started card of the Virtualization Overview page', () => {
  before(() => {
    cy.Login();
    cy.visit('/virtualization/overview');
  });

  it('ID(CNV-7940) Getting started card is displayed and can be toggled', () => {
    cy.get(virtOverview.gettingStartedCard).should(EXIST);
    cy.get(virtOverview.hideGettingStartedCardKebab).click();
    cy.get(virtOverview.hideGettingStartedCardTooltip).should(EXIST);
    cy.get(virtOverview.hideGettingStartedCardTooltip).click();

    cy.get(virtOverview.gettingStartedCard).should(NOT_EXIST);

    cy.get(virtOverview.restoreGettingStartedBtn).should(EXIST);
    cy.get(virtOverview.restoreGettingStartedBtn).click();
    cy.get(virtOverview.gettingStartedCard).should(EXIST);
  });

  it('ID(CNV-7927) Quick starts card is displayed', () => {
    cy.get(virtOverview.quickStartCard).should(EXIST);
  });

  it('ID(CNV-7924) Feature highlights card is displayed', () => {
    cy.get(virtOverview.featureHighlightsCard).should(EXIST);
  });

  it('ID(CNV-7925) Recommended operators card is displayed', () => {
    cy.get(virtOverview.recommendedOperatorsCard).should(EXIST);
  });
});
