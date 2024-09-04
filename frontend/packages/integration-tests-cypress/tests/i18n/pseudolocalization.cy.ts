import { checkErrors } from '../../support';
import { masthead } from '../../views/masthead';

const url = '/dashboards?pseudolocalization=true&lng=en';

describe('Localization', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  it('pseudolocalizes masthead', () => {
    cy.log('test masthead');
    cy.visitWithDefaultLang(url);
    masthead.clickMastheadLink('help-dropdown-toggle');
    cy.byTestID('help-dropdown').within(() => {
      // wait for both console help menu items and additionalHelpActions items to load
      cy.get('ul[role="menu"]').should('have.length', 2);
      // Test that all links are translated
      cy.get('ul[role="menu"] [role="menuitem"]').isPseudoLocalized();
    });
  });

  it('pseudolocalizes activity card', () => {
    cy.log('test activity card components');
    cy.visitWithDefaultLang(url);
    cy.byTestID('activity').isPseudoLocalized();
    cy.byTestID('activity-recent-title').isPseudoLocalized();
    cy.byTestID('ongoing-title').isPseudoLocalized();
    cy.byTestID('events-view-all-link').isPseudoLocalized();
    cy.byTestID('events-pause-button').isPseudoLocalized();
  });

  it('pseudolocalizes utilization card', () => {
    cy.log('test utilization card components');
    cy.visitWithDefaultLang(url);
    cy.byLegacyTestID('utilization-card').within(() => {
      cy.byTestID('utilization-card__title').isPseudoLocalized();
      cy.byTestID('utilization-card-item-text').isPseudoLocalized();
    });
  });
});
