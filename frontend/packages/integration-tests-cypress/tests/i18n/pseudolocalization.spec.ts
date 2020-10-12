import { checkErrors } from '../../support';
import { masthead } from '../../views/masthead';

describe('Localization', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('pseudolocalizes masthead', () => {
    cy.log('test masthead');
    cy.visit('/dashboards?pseudolocalization=true&lng=en');
    masthead.clickMastheadLink('help-dropdown-toggle');
    cy.byTestID('application-launcher-item').isPseudoLocalized();
  });

  it('pseudolocalizes navigation', () => {
    cy.log('test navigation');
    cy.visit('/dashboards?pseudolocalization=true&lng=en');
    cy.byTestID('nav').isPseudoLocalized();
  });

  it('pseudolocalizes activity card', () => {
    cy.log('test activity card components');
    cy.visit('/dashboards?pseudolocalization=true&lng=en');
    cy.byTestID('activity').isPseudoLocalized();
    cy.byTestID('activity-recent-title').isPseudoLocalized();
    cy.byTestID('ongoing-title').isPseudoLocalized();
    cy.byTestID('events-view-all-link').isPseudoLocalized();
    cy.byTestID('events-pause-button').isPseudoLocalized();
  });

  it('pseudolocalizes utilization card', () => {
    cy.log('test utilization card components');
    cy.visit('/dashboards?pseudolocalization=true&lng=en');
    cy.byTestID('utilization-card-item-text').isPseudoLocalized();
  });

  it('pseudolocalizes timestamps', () => {
    cy.log('test timestamps');
    cy.visit('/k8s/all-namespaces/events?pseudolocalization=true&lng=en');
    cy.byTestID('timestamp').isPseudoLocalized();
  });
});
