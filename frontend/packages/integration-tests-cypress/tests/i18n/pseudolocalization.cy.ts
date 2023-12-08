import { checkErrors } from '../../support';
import { masthead } from '../../views/masthead';

describe('Localization', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  it('pseudolocalizes masthead', () => {
    cy.log('test masthead');
    cy.visitWithDefaultLang('/dashboards?pseudolocalization=true');
    masthead.clickMastheadLink('help-dropdown-toggle');
    cy.byTestID('help-dropdown-toggle').within(() => {
      // wait for both console help menu items and additionalHelpActions items to load
      cy.get('section').should('have.length', 2);
      // Test that all links are translated
      cy.get('section [role="menuitem"]').isPseudoLocalized();
    });
  });

  it('pseudolocalizes navigation', () => {
    cy.log('test navigation');
    cy.visitWithDefaultLang('/dashboards?pseudolocalization=true');
    cy.byTestID('nav').isPseudoLocalized();
  });

  it('pseudolocalizes activity card', () => {
    cy.log('test activity card components');
    cy.visitWithDefaultLang('/dashboards?pseudolocalization=true');
    cy.byTestID('activity').isPseudoLocalized();
    cy.byTestID('activity-recent-title').isPseudoLocalized();
    cy.byTestID('ongoing-title').isPseudoLocalized();
    cy.byTestID('events-view-all-link').isPseudoLocalized();
    cy.byTestID('events-pause-button').isPseudoLocalized();
  });

  it('pseudolocalizes utilization card', () => {
    cy.log('test utilization card components');
    cy.visitWithDefaultLang('/dashboards?pseudolocalization=true');
    cy.byLegacyTestID('utilization-card').within(() => {
      cy.byTestID('utilization-card__title').isPseudoLocalized();
      cy.byTestID('utilization-card-item-text').isPseudoLocalized();
    });
  });
});
