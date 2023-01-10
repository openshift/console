import { checkErrors } from '../../support';
import { projectDropdown } from '../../views/common';
import { guidedTour } from '../../views/guided-tour';
import { listPage } from '../../views/list-page';
import { nav } from '../../views/nav';

const LOCAL_CLUSTER = 'local-cluster';
const APOLLO_CLUSTER = 'apollo-cluster';
const BRAVO_CLUSTER = 'bravo-cluster';
const MULTI_CLUSTER_ARRAY = [APOLLO_CLUSTER, BRAVO_CLUSTER];
describe('Multi Cluster Perspective Test', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Developer');
    nav.sidenav.switcher.shouldHaveText('Developer');
    guidedTour.close();
    cy.window().then((win: any) => {
      win.SERVER_FLAGS.clusters = MULTI_CLUSTER_ARRAY;
      // Now that we've changed the flags, trigger a rerender of the nav by changing perspective
      nav.sidenav.switcher.changePerspectiveTo('Administrator');
      nav.sidenav.switcher.shouldHaveText('Administrator');
    });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
    cy.reload();
  });

  it('renders cluster switcher in side nav', () => {
    nav.sidenav.clusters.shouldHaveText(LOCAL_CLUSTER);
  });

  it('renders mock pod data of fake bravo-cluster', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Pods']);
    cy.intercept(`api/kubernetes/api/v1/namespaces/openshift-apiserver/pods*${LOCAL_CLUSTER}`).as(
      'fetchLocalPods',
    );
    projectDropdown.selectProject('openshift-apiserver');
    cy.wait('@fetchLocalPods').then((interception) => {
      // Capture local cluster pod data and mock the name by adding bravo-cluster
      const bravoMockPods = interception.response?.body;
      const mockPods = bravoMockPods?.items.map((podData) => {
        podData.metadata.name = `${BRAVO_CLUSTER}-${podData.metadata.name}`;
        return podData;
      });
      bravoMockPods.items = mockPods;
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
      // Intercept the targeted pods fetch and replace it with the mock pod data
      cy.intercept(`api/kubernetes/api/v1/namespaces/openshift-apiserver/pods*${BRAVO_CLUSTER}`, {
        ...bravoMockPods,
      }).as('fetchBravoPods');
      nav.sidenav.clusters.changeClusterTo(BRAVO_CLUSTER);
      nav.sidenav.clusters.shouldHaveText(BRAVO_CLUSTER);
      cy.wait('@fetchBravoPods');
      listPage.rows.shouldExist(`${BRAVO_CLUSTER}-apiserver-`);
    });
  });
});
