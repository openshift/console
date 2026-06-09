import { checkErrors } from '../../support';

const INSIGHTS_HEALTH_ITEM = '[data-item-id="Insights-health-item"]';
const INSIGHTS_BUTTON = '[data-test="Insights"]';

describe('Insights Popup on Cluster Dashboard', () => {
  before(() => {
    cy.login();
    cy.visit('/dashboards');
    cy.byLegacyTestID('status-card').should('be.visible');
    // Wait until all health items have finished loading (no skeleton loaders remain)
    cy.byLegacyTestID('status-card').within(() => {
      cy.get('.skeleton-health', { timeout: 30000 }).should('not.exist');
    });
  });

  afterEach(() => {
    checkErrors();
  });

  it('displays the Insights health item in the status card', () => {
    cy.get(INSIGHTS_HEALTH_ITEM).should('be.visible');
    cy.get(INSIGHTS_BUTTON).filter('button').should('be.visible');
  });

  it('opens the Insights popup when clicking the health item', () => {
    cy.get(INSIGHTS_BUTTON).filter('button').click();
    cy.get('.pf-v6-c-popover').should('be.visible');
    cy.get('.pf-v6-c-popover').should('contain.text', 'Red Hat Lightspeed Advisor status');
  });

  it('shows last refresh timestamp in the popup', () => {
    cy.get(INSIGHTS_BUTTON).filter('button').click();
    cy.get('.pf-v6-c-popover').within(() => {
      cy.contains('Last refresh').should('be.visible');
    });
  });

  it('shows the advisor description text', () => {
    cy.get(INSIGHTS_BUTTON).filter('button').click();
    cy.get('.pf-v6-c-popover').within(() => {
      cy.contains('Red Hat Lightspeed Advisor identifies and prioritizes').should('be.visible');
    });
  });

  it('renders severity links pointing to the correct Red Hat Insights advisor URL', () => {
    cy.get(INSIGHTS_BUTTON).filter('button').click();
    cy.get('.pf-v6-c-popover').within(() => {
      cy.get('a[href*="console.redhat.com/openshift/insights/advisor"]').should('exist');
      cy.get('a[href*="console.redhat.com/openshift/insights/advisor"]')
        .first()
        .should('have.attr', 'target', '_blank');
    });
  });

  it('severity links include total_risk query parameter', () => {
    cy.get(INSIGHTS_BUTTON).filter('button').click();
    cy.get('.pf-v6-c-popover').within(() => {
      cy.get('a[href*="total_risk="]')
        .should('have.length.greaterThan', 0)
        .each(($link) => {
          const href = $link.attr('href');
          const totalRisk = new URL(href, 'https://placeholder').searchParams.get('total_risk');
          expect(['1', '2', '3', '4']).to.include(totalRisk);
        });
    });
  });

  it('shows "View all recommendations" or "View more" link', () => {
    cy.get(INSIGHTS_BUTTON).filter('button').click();
    cy.get('.pf-v6-c-popover').then(($popover) => {
      if (
        $popover.find('a[href*="console.redhat.com/openshift/insights/advisor/clusters/"]').length
      ) {
        cy.wrap($popover)
          .contains('View all recommendations in Red Hat Lightspeed Advisor')
          .should('be.visible');
      } else {
        cy.wrap($popover).contains('View more in Red Hat Lightspeed Advisor').should('be.visible');
      }
    });
  });
});
