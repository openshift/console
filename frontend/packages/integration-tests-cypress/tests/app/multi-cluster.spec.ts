import { checkErrors } from '../../support';
import { projectDropdown } from '../../views/common';
import { guidedTour } from '../../views/guided-tour';
import { listPage } from '../../views/list-page';
import { nav } from '../../views/nav';

const MULTI_CLUSTER_ARRAY = ['apollo-cluster', 'bravo-cluster'];
describe('Multi Cluster Perspective Test', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Developer');
    nav.sidenav.switcher.shouldHaveText('Developer');
    guidedTour.close();
    cy.window().then((win: any) => {
      win.SERVER_FLAGS.clusters = MULTI_CLUSTER_ARRAY;
      nav.sidenav.switcher.changePerspectiveTo('Administrator');
      nav.sidenav.switcher.shouldHaveText('Administrator');
      nav.sidenav.clusters.shouldHaveText('local-cluster');
    });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.window().then((win: any) => {
      win.SERVER_FLAGS.clusters = [];
      cy.logout();
      cy.reload();
    });
  });

  it('renders cluster switcher in side nav', () => {
    nav.sidenav.clusters.shouldHaveText('local-cluster');
  });

  it('renders mock pod data of fake bravo-cluster', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Pods']);
    projectDropdown.selectProject('openshift-apiserver');
    listPage.rows.shouldBeLoaded();
    listPage.rows.shouldExist('apiserver-');
    // Intercept and return empty arrays for failing fetch calls that we're not targeting for this test.
    cy.intercept('/api/kubernetes/apis/console.openshift.io/v1/consolequickstarts*', {
      consolequickstarts: [],
    }).as('checkQuickstarts');
    cy.intercept('/api/kubernetes/apis/console.openshift.io/v1/consolenotifications*', {
      consolenotifications: [],
    }).as('checkNotifications');
    cy.intercept('/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version*', {
      clusterversions: [],
    }).as('checkVersions');
    // Intercept the targeted pods fetch and replace it with the fixture json file
    cy.intercept('api/kubernetes/api/v1/namespaces/openshift-apiserver/pods*', {
      fixture: 'apiserver-pods.json',
    }).as('fetchPods');
    nav.sidenav.clusters.changeClusterTo('bravo-cluster');
    nav.sidenav.clusters.shouldHaveText('bravo-cluster');
    cy.wait('@fetchPods');
    listPage.rows.shouldExist('bravo-apiserver-');
  });
});
