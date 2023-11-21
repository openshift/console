import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';
import { guidedTour } from '../../views/guided-tour';
import { listPage } from '../../views/list-page';
import { nav } from '../../views/nav';

describe('Visiting other routes', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  const otherRoutes: { path: string; waitFor: () => void }[] = [
    {
      path: '/',
      waitFor: () => {
        cy.byLegacyTestID('resource-title').should('exist');
        cy.byTestID('skeleton-chart').should('not.exist');
      },
    },
    {
      path: '/k8s/cluster/clusterroles/view',
      waitFor: () => cy.byLegacyTestID('resource-title').should('exist'),
    },
    {
      path: '/k8s/cluster/nodes',
      waitFor: () => listPage.rows.shouldBeLoaded(),
    },
    {
      path: '/k8s/all-namespaces/events',
      waitFor: () => cy.get('[role="row"]').should('be.visible'),
    },
    {
      path: '/k8s/all-namespaces/import',
      waitFor: () => cy.get('textarea').should('be.visible'),
    },
    {
      path: '/api-explorer',
      waitFor: () => cy.get('[data-ouia-component-type$="TableRow"]').should('be.visible'),
    },
    {
      path: '/api-resource/ns/default/core~v1~Pod',
      waitFor: () => detailsPage.isLoaded(),
    },
    {
      path: '/api-resource/ns/default/core~v1~Pod/schema',
      waitFor: () => cy.get('li.co-resource-sidebar-item').should('be.visible'),
    },
    {
      path: '/api-resource/ns/default/core~v1~Pod/instances',
      waitFor: () => cy.byLegacyTestID('api-explorer-resource-title').contains('Pod'),
    },
    ...(Cypress.env('openshift') === true
      ? [
          {
            path: '/api-resource/ns/default/core~v1~Pod/access',
            waitFor: () => cy.get('[data-ouia-component-type$="TableRow"]').should('be.visible'),
          },
          {
            path: '/k8s/cluster/user.openshift.io~v1~User',
            waitFor: () => {},
          },
          {
            path: '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~Machine',
            waitFor: () => listPage.rows.shouldBeLoaded(),
          },
          {
            path: '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~MachineSet',
            waitFor: () => listPage.rows.shouldBeLoaded(),
          },
          {
            path:
              '/k8s/ns/openshift-machine-api/autoscaling.openshift.io~v1beta1~MachineAutoscaler',
            waitFor: () => cy.byTestID('empty-message').should('be.visible'),
          },
          {
            path: '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~MachineHealthCheck',
            waitFor: () => listPage.rows.shouldBeLoaded(),
          },
          {
            path: '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig',
            waitFor: () => listPage.rows.shouldBeLoaded(),
          },
          {
            path: '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfigPool',
            waitFor: () => listPage.rows.shouldBeLoaded(),
          },
          {
            path: '/k8s/all-namespaces/monitoring.coreos.com~v1~Alertmanager',
            waitFor: () => listPage.rows.shouldBeLoaded(),
          },
          {
            path: '/k8s/ns/openshift-monitoring/monitoring.coreos.com~v1~Alertmanager/main',
            waitFor: () => {
              detailsPage.isLoaded();
              cy.byTestID('label-list').should('be.visible');
            },
          },
          {
            path: '/settings/cluster',
            waitFor: () => cy.byLegacyTestID('cluster-version').should('exist'),
          },
          {
            // Test loading search page for a kind with no static model.
            path: '/search/all-namespaces?kind=config.openshift.io~v1~Console',
            waitFor: () => listPage.rows.shouldBeLoaded(),
          },
        ]
      : []),
  ];
  otherRoutes.forEach((route) => {
    it(`successfully displays view for route: ${route.path.replace(/\//g, ' ')}`, () => {
      cy.visit(route.path);
      cy.url().should('equal', Cypress.config().baseUrl + route.path);
      cy.byTestID('loading-indicator').should('not.exist');
      cy.byLegacyTestID('error-page').should('not.exist');
      if (route.waitFor) {
        route.waitFor();
      }
      cy.testA11y(`route ${route.path.replace(/\//g, ' ')}`);
    });
  });
});

describe('Test perspective query parameters', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.initAdmin();
    cy.visit('/k8s/cluster/projects');
    listPage.rows.shouldBeLoaded();
    guidedTour.close();
  });

  afterEach(() => {
    checkErrors();
  });

  it('tests Developer query parameter', () => {
    cy.visit('/topology/all-namespaces', {
      qs: {
        view: 'graph',
        perspective: 'dev',
      },
    });
    nav.sidenav.switcher.shouldHaveText('Developer');
    guidedTour.close();
  });
  it('tests Administrator query parameter', () => {
    nav.sidenav.switcher.changePerspectiveTo('Developer');
    nav.sidenav.switcher.shouldHaveText('Developer');
    guidedTour.close();
    cy.visit('/dashboards', {
      qs: {
        perspective: 'admin',
      },
    });
    nav.sidenav.switcher.shouldHaveText('Administrator');
  });
});
