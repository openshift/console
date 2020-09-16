import { checkErrors } from '../../support';

describe('Visiting other routes', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  const otherRoutes = [
    '/',
    '/k8s/cluster/clusterroles/view',
    '/k8s/cluster/nodes',
    '/k8s/all-namespaces/events',
    '/k8s/all-namespaces/import',
    '/api-explorer',
    '/api-resource/ns/default/core~v1~Pod',
    '/api-resource/ns/default/core~v1~Pod/schema',
    '/api-resource/ns/default/core~v1~Pod/instances',
    ...(Cypress.env('openshift') === true
      ? [
          '/api-resource/ns/default/core~v1~Pod/access',
          '/k8s/cluster/user.openshift.io~v1~User',
          '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~Machine',
          '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~MachineSet',
          '/k8s/ns/openshift-machine-api/autoscaling.openshift.io~v1beta1~MachineAutoscaler',
          '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~MachineHealthCheck',
          '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig',
          '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfigPool',
          '/k8s/all-namespaces/monitoring.coreos.com~v1~Alertmanager',
          '/k8s/ns/openshift-monitoring/monitoring.coreos.com~v1~Alertmanager/main',
          '/settings/cluster',
          '/monitoring/query-browser',
          // Test loading search page for a kind with no static model.
          '/search/all-namespaces?kind=config.openshift.io~v1~Console',
        ]
      : []),
  ];
  otherRoutes.forEach((route) => {
    it(`successfully displays view for route: ${route}`, () => {
      cy.visit(route);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000); // wait for page to load
      cy.byLegacyTestID('error-page').should('not.be.visible');
      cy.testA11y(`${route} page`);
    });
  });
});
