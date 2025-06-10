import { checkErrors } from '../../support';
import { isLocalDevEnvironment } from '../../views/common';
import { refreshWebConsoleLink } from '../../views/form';
import { guidedTour } from '../../views/guided-tour';

describe('Cluster dashboard', () => {
  before(() => {
    cy.login();
    guidedTour.close();
  });

  beforeEach(() => {
    cy.visit(`/dashboards`);
  });

  describe('Disabled Getting started resources banner', () => {
    it('it disables the GettingStartedBanner capability on console-operator config', () => {
      cy.exec(
        `oc patch console.operator.openshift.io cluster --patch '{ "spec": { "customization": { "capabilities": [{"name": "LightspeedButton","visibility": {"state":"Enabled"}}, {"name": "GettingStartedBanner","visibility": {"state":"Disabled"}}] } } }' --type=merge`,
      )
        .its('stdout')
        .then(() => {
          cy.byTestID(refreshWebConsoleLink, { timeout: 300000 })
            .should('exist')
            .then(() => {
              cy.reload();
              cy.byLegacyTestID('dashboard').should('not.exist');
            });
        });
    });
  });

  describe('Details Card', () => {
    it('has all fields populated', () => {
      cy.byLegacyTestID('details-card').should('be.visible');
      let expectedTitles = [
        'Cluster API address',
        'Cluster ID',
        'Infrastructure provider',
        'OpenShift version',
        'Service Level Agreement (SLA)',
        'Update channel',
      ];
      if (isLocalDevEnvironment) {
        expectedTitles = expectedTitles.slice(5, 1);
      }
      cy.byTestID('detail-item-title').should('have.length', isLocalDevEnvironment ? 5 : 6);
      expectedTitles.forEach((title, i) => {
        cy.byTestID('detail-item-title').eq(i).should('have.text', title);
      });
      let expectedValues = [
        { assertion: 'include.text', value: 'https://' },
        { assertion: 'include.text', value: '-' },
        { assertion: 'not.to.be.empty' },
        { assertion: 'include.text', value: '.' },
        { assertion: 'not.to.be.empty' },
        { assertion: 'not.to.be.empty' },
      ];
      if (isLocalDevEnvironment) {
        expectedValues = expectedValues.slice(5, 1);
      }
      cy.byTestID('detail-item-value').should('have.length', isLocalDevEnvironment ? 5 : 6);
      expectedValues.forEach(({ assertion, value }, i) => {
        cy.byTestID('detail-item-value').eq(i).should(assertion, value);
      });
    });
    it('has View settings link', () => {
      cy.byTestID('details-card-view-settings')
        .should('be.visible')
        .and('have.attr', 'href', `/settings/cluster/`);
    });
  });

  describe('Status Card', () => {
    it('has View alerts link', () => {
      cy.byTestID('status-card-view-alerts')
        .should('be.visible')
        .and('have.attr', 'href', `/monitoring/alerts`);
    });
    it('has health indicators', () => {
      cy.byLegacyTestID('status-card').should('be.visible');
      const expectedTitles = ['Cluster', 'Control Plane', 'Operators', 'Dynamic Plugins'];
      expectedTitles.forEach((title) => {
        cy.byTestID(title).should('include.text', title);
      });
    });
  });

  describe('Inventory Card', () => {
    it('has all items', () => {
      cy.byLegacyTestID('inventory-card').should('be.visible');
      const inventoryItems = [
        { title: 'Node', link: '/k8s/cluster/nodes' },
        { title: 'Pod', link: '/k8s/all-namespaces/pods' },
        { title: 'StorageClass', link: '/k8s/cluster/storageclasses' },
        { title: 'PersistentVolumeClaim', link: '/k8s/all-namespaces/persistentvolumeclaims' },
      ];
      inventoryItems.forEach((item, i) => {
        cy.byTestID('resource-inventory-item').eq(i).invoke('text').should('include', item.title);
        cy.byTestID('resource-inventory-item').eq(i).should('have.attr', 'href', item.link);
      });
    });
  });

  describe('Utilization Card', () => {
    it('has all items', () => {
      cy.byLegacyTestID('utilization-card').should('be.visible');
      const utilizationItems = ['CPU', 'Memory', 'Filesystem', 'Network transfer', 'Pod count'];
      cy.byLegacyTestID('utilization-item').should('have.length', utilizationItems.length);
      utilizationItems.forEach((title, i) => {
        cy.byTestID('utilization-item-title').eq(i).should('have.text', title);
      });
    });
    it('has duration dropdown', () => {
      cy.byLegacyTestID('duration-select').should('have.text', '1 hour');
    });
  });

  describe('Activity Card', () => {
    it('has View events link', () => {
      cy.byTestID('view-events-link')
        .should('have.text', 'View events')
        .and('have.attr', 'href', `/k8s/all-namespaces/events`);
    });
    it('has Pause events button', () => {
      cy.byTestID('events-pause-button').should('be.visible').and('have.text', 'Pause');
    });
  });

  afterEach(() => {
    checkErrors();
  });
});
