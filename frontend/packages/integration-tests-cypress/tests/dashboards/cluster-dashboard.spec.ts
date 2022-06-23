import { checkErrors } from '../../support';
import { nav } from '../../views/nav';

describe('Cluster dashboard', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
  });

  beforeEach(() => {
    cy.visit(`/dashboards`);
  });

  describe('Details Card', () => {
    it('has all fields populated', () => {
      cy.byLegacyTestID('details-card').should('be.visible');
      const expectedTitles = [
        'Cluster API address',
        'Cluster ID',
        'Infrastructure provider',
        'OpenShift version',
        'Service Level Agreement (SLA)',
        'Update channel',
      ];
      cy.byTestID('detail-item-title').should('have.length', 6);
      expectedTitles.forEach((title, i) => {
        cy.byTestID('detail-item-title')
          .eq(i)
          .should('have.text', title);
      });
      const expectedValues = [
        { assertion: 'include.text', value: 'https://' },
        { assertion: 'include.text', value: '-' },
        { assertion: 'not.to.be.empty' },
        { assertion: 'include.text', value: '.' },
        { assertion: 'not.to.be.empty' },
        { assertion: 'not.to.be.empty' },
      ];
      cy.byTestID('detail-item-value').should('have.length', 6);
      expectedValues.forEach(({ assertion, value }, i) => {
        cy.byTestID('detail-item-value')
          .eq(i)
          .should(assertion, value);
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
        cy.byTestID('resource-inventory-item')
          .eq(i)
          .invoke('text')
          .should('include', item.title);
        cy.byTestID('resource-inventory-item')
          .eq(i)
          .should('have.attr', 'href', item.link);
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
      cy.byTestID('view-events-link')
        .should('have.text', 'View events')
        .and('have.attr', 'href', `/k8s/all-namespaces/events`);
    });
    it('has Pause events button', () => {
      cy.byTestID('events-pause-button')
        .should('be.visible')
        .and('have.text', 'Pause');
    });
  });

  afterEach(() => {
    checkErrors();
  });
});
