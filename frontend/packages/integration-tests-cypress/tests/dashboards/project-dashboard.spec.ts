import { checkErrors, testName } from '../../support';
import { nav } from '../../views/nav';

describe('Project dashboard', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
  });

  beforeEach(() => {
    cy.visit(`/k8s/cluster/projects/${testName}`);
  });

  describe('Details Card', () => {
    it('has all fields populated', () => {
      cy.byLegacyTestID('details-card').should('be.visible');

      const expectedTitles = ['Name', 'Requester', 'Labels', 'Description'];
      cy.byTestID('detail-item-title').should('have.length', 4);
      expectedTitles.forEach((title, i) => {
        cy.byTestID('detail-item-title')
          .eq(i)
          .should('have.text', title);
      });

      const expectedValues = [
        { assertion: 'have.text', value: testName },
        { assertion: 'have.text', value: 'kube:admin' },
        { assertion: 'include.text', value: `kubernetes.io/metadata.name=${testName}` },
        { assertion: 'have.text', value: 'No description' },
      ];
      cy.byTestID('detail-item-value').should('have.length', 4);
      expectedValues.forEach(({ assertion, value }, i) => {
        cy.byTestID('detail-item-value')
          .eq(i)
          .should(assertion, value);
      });
    });

    it('has View all link', () => {
      cy.byTestID('details-card-view-all').click();
      cy.url().should('include', `/k8s/cluster/projects/${testName}/details`);
    });
  });

  describe('Status Card', () => {
    it('has health indicator', () => {
      cy.byLegacyTestID('status-card').should('be.visible');
      cy.byTestID('project-status').should('have.text', 'Active');
    });
  });

  describe('Inventory Card', () => {
    it('has all items', () => {
      const inventoryItems = [
        { kind: 'Deployment', path: `/k8s/ns/${testName}/deployments` },
        { kind: 'DeploymentConfig', path: `/k8s/ns/${testName}/deploymentconfigs` },
        { kind: 'StatefulSets', path: `/k8s/ns/${testName}/statefulsets` },
        { kind: 'Pod', path: `/k8s/ns/${testName}/pods` },
        { kind: 'PersistentVolumeClaim', path: `/k8s/ns/${testName}/persistentvolumeclaims` },
        { kind: 'Service', path: `/k8s/ns/${testName}/services` },
        { kind: 'Route', path: `/k8s/ns/${testName}/routes` },
        { kind: 'ConfigMap', path: `/k8s/ns/${testName}/configmaps` },
        { kind: 'Secret', path: `/k8s/ns/${testName}/secrets` },
        {
          kind: 'VolumeSnapshot',
          path: `/k8s/ns/${testName}/snapshot.storage.k8s.io~v1~VolumeSnapshot`,
        },
      ];
      cy.byLegacyTestID('inventory-card').should('be.visible');
      inventoryItems.forEach((item, i) => {
        cy.byTestID('resource-inventory-item')
          .eq(i)
          .invoke('text')
          .should('match', new RegExp(`^[0-9]+ ${item.kind}s?$`));
        cy.byTestID('resource-inventory-item')
          .eq(i)
          .should('have.attr', 'href', item.path);
      });
    });
  });

  describe('Utilization Card', () => {
    it('has all items', () => {
      cy.byLegacyTestID('utilization-card').should('be.visible');
      const utilizationItems = ['CPU', 'Memory', 'Filesystem', 'Network transfer', 'Pod count'];
      cy.byLegacyTestID('utilization-item').should('have.length', utilizationItems.length);
      utilizationItems.forEach((title, i) => {
        cy.byTestID('utilization-item-title')
          .eq(i)
          .should('have.text', title);
      });
    });
    it('has duration dropdown', () => {
      cy.byLegacyTestID('duration-select').should('have.text', '1 hour');
    });
  });

  describe('Activity Card', () => {
    it('has View events link', () => {
      cy.byLegacyTestID('activity-card').should('be.visible');
      cy.byTestID('view-events-link')
        .should('have.text', 'View events')
        .and('have.attr', 'href', `/k8s/ns/${testName}/events`);
    });
    it('has Pause events button', () => {
      cy.byTestID('events-pause-button')
        .should('be.visible')
        .and('have.text', 'Pause');
      cy.byTestID('events-pause-button').click();
      cy.byTestID('events-pause-button').should('have.text', 'Resume');
    });
  });

  describe('Launcher Card', () => {
    const consoleLink = {
      apiVersion: 'console.openshift.io/v1',
      kind: 'ConsoleLink',
      metadata: {
        name: `link-${testName}`,
      },
      spec: {
        href: 'https://www.example.com/',
        location: 'NamespaceDashboard',
        namespaceDashboard: {
          namespaces: [testName],
        },
        text: 'Namespace Dashboard Link',
      },
    };

    before(() => {
      cy.exec(`echo '${JSON.stringify(consoleLink)}' | oc apply -f -`);
    });

    after(() => {
      cy.exec(`oc delete consolelink ${consoleLink.metadata.name}`);
      cy.byLegacyTestID('launcher-card').should('not.exist');
    });

    it('is displayed when CR exists', () => {
      cy.byLegacyTestID('launcher-card').should('be.visible');
      cy.byLegacyTestID('launcher-item')
        .should('have.text', consoleLink.spec.text)
        .and('have.attr', 'href', consoleLink.spec.href);
    });
  });

  describe('Resource Quotas Card', () => {
    const resourceQuota = {
      apiVersion: 'v1',
      kind: 'ResourceQuota',
      metadata: {
        name: 'example',
        namespace: testName,
      },
      spec: {
        hard: {
          pods: '4',
          'requests.cpu': '1',
          'requests.memory': '1Gi',
          'limits.cpu': '2',
          'limits.memory': '2Gi',
        },
      },
    };
    before(() => {
      cy.exec(`echo '${JSON.stringify(resourceQuota)}' | oc apply -n ${testName} -f -`);
    });

    after(() => {
      cy.exec(`oc delete resourcequotas ${resourceQuota.metadata.name} -n ${testName}`);
      cy.byTestID('resource-quota-link').should('not.exist');
      cy.byTestID('resource-quota-gauge-chart').should('not.exist');
    });

    it('shows Resource Quotas', () => {
      cy.byLegacyTestID('resource-quotas-card').should('exist');
      cy.byTestID('resource-quota-link').should('have.text', resourceQuota.metadata.name);
      cy.byTestID('resource-quota-gauge-chart').should('have.length', 4);
    });
  });

  afterEach(() => {
    checkErrors();
  });
});
