import { checkErrors } from '../../support';
import { guidedTour } from '../../views/guided-tour';
import { nav } from '../../views/nav';
import { masthead } from '../../views/masthead';

describe('Auth test', () => {
  const KUBEADMIN_IDP = 'kube:admin';
  const KUBEADMIN_USERNAME = 'kubeadmin';

  afterEach(() => {
    checkErrors();
    cy.logout();
  });

  if (Cypress.env('BRIDGE_KUBEADMIN_PASSWORD')) {
    it('logs in as test user via htpasswd identity provider, verifies sidenav menus, switches perspectives', () => {
      const idp = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
      const username = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
      const passwd = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
      cy.login(idp, username, passwd);
      cy.url().should('include', Cypress.env('appHost'));
      guidedTour.close();
      masthead.username.shouldHaveText(username);

      cy.log('switches from dev to admin perspective');
      nav.sidenav.switcher.shouldHaveText('Developer');
      nav.sidenav.switcher.changePerspectiveTo('Administrator');
      nav.sidenav.switcher.shouldHaveText('Administrator');

      cy.log('does not show admin nav items in Administration to test user');
      nav.sidenav.shouldNotHaveNavSection(['Administration', 'Cluster Status']);
      nav.sidenav.shouldNotHaveNavSection(['Administration', 'Cluster Settings']);
      nav.sidenav.shouldNotHaveNavSection(['Administration', 'Namespaces']);
      nav.sidenav.shouldNotHaveNavSection(['Administration', 'Custom Resource Definitions']);

      cy.log('does not show admin nav items in Operators to test user');
      nav.sidenav.shouldNotHaveNavSection(['Operators', 'OperatorHub']);

      cy.log('does not show admin nav items in Storage to test user');
      nav.sidenav.shouldNotHaveNavSection(['Storage', 'Persistent Volumes']);

      cy.log('does not show Compute or Monitoring to test user');
      nav.sidenav.shouldNotHaveNavSection(['Compute']);
      nav.sidenav.shouldNotHaveNavSection(['Monitoring']);
    });
  }

  it(`log in as kubeadmin user, verify sidenav menus`, () => {
    cy.login(KUBEADMIN_IDP, KUBEADMIN_USERNAME, Cypress.env('BRIDGE_KUBEADMIN_PASSWORD'));
    cy.visit(``);
    cy.url().should('include', Cypress.env('appHost'));
    masthead.username.shouldHaveText(KUBEADMIN_IDP);
    cy.byTestID('global-notification-text').contains(
      'You are logged in as a temporary administrative user. Update the cluster OAuth configuration to allow others to log in.',
    );

    cy.log('is authenticated as cluster admin user');
    nav.sidenav.shouldHaveNavSection(['Compute']);
    nav.sidenav.shouldHaveNavSection(['Operators']);
    nav.sidenav.clickNavLink(['Administration', 'Cluster Settings']);
    cy.byLegacyTestID('cluster-settings-page-heading').should('be.visible');
  });
});
