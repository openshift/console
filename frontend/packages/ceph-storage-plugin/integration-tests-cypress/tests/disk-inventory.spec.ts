const fetchLocalVolumeDiscovery = () =>
  cy.exec(
    `kubectl get --ignore-not-found localvolumediscoveryresults -n openshift-storage -A -o json`,
    { timeout: 100000 },
  );

const getLSOstate = () =>
  cy.exec(`kubectl get namespace openshift-local-storage -A -o json`, { failOnNonZeroExit: false });

const localStorageDiscovery = {
  apiVersion: 'local.storage.openshift.io/v1alpha1',
  kind: 'LocalVolumeDiscovery',
  metadata: {
    name: 'auto-discover-devices',
    namespace: 'openshift-local-storage',
  },
};

const createLocalDiscovery = () => {
  cy.exec(`echo '${JSON.stringify(localStorageDiscovery)}' | kubectl create -f -`);
};

describe('Disk list is accessible from Nodes view', () => {
  const diskStatusCount = {
    Available: 0,
    NotAvailable: 0,
    Unknown: 0,
  };

  const localvolumediscoveryresults = {
    name: null,
    nodeName: null,
    discoveredDevices: null,
  };

  const toggleDiskSelect = (diskStatus: string) => {
    cy.byLegacyTestID('filter-dropdown-toggle').click();
    cy.byTestRowFilter(diskStatus)
      .parent()
      .click();
  };

  const testDiskSelection = (diskStatus: string, diskStatusCnt: number) => {
    toggleDiskSelect(diskStatus);
    if (diskStatusCnt === 0) {
      cy.byTestRows('resource-row').should('not.exist');
    } else {
      cy.byTestRows('resource-row')
        .parent()
        .find('tr')
        .should('have.length', diskStatusCnt);
    }
    toggleDiskSelect(diskStatus);
  };

  before(() => {
    cy.login();
    cy.visit('/');

    // Create LSO if does not exist
    getLSOstate().then((res) => {
      if (!res.stdout) {
        cy.clickNavLink(['Operators', 'OperatorHub']);
        cy.byTestID('search-operatorhub').type('local storage');
        cy.byTestID('local-storage-operator-redhat-operators-openshift-marketplace').click();
        cy.byLegacyTestID('operator-install-btn').click({ force: true });
        cy.byTestID('install-operator').click();

        // Wait until the currently created LSO loaded.
        cy.byTestID('success-icon', { timeout: 100000 }).should('be.visible');
        createLocalDiscovery();
      }
    });

    // Looking for the local storage operator in all project list
    cy.clickNavLink(['Operators', 'Installed Operators']);
    cy.byLegacyTestID('namespace-bar-dropdown')
      .find('button')
      .click();
    cy.byLegacyTestID('namespace-bar-dropdown')
      .contains('li', 'All Projects')
      .click();
    cy.byTestOperatorRow('Local Storage').click();
    cy.byLegacyTestID('horizontal-link-Local Volume Discovery Result').click();
    // Wait until the local volume discovery results loaded.
    cy.byTestRows('resource-row', { timeout: 100000 }).should('be.visible');

    cy.clickNavLink(['Compute', 'Nodes']);
    fetchLocalVolumeDiscovery().then((res) => {
      const json = JSON.parse(res.stdout);
      localvolumediscoveryresults.name = json.items[0].metadata.name;
      localvolumediscoveryresults.nodeName = json.items[0].spec.nodeName;
      localvolumediscoveryresults.discoveredDevices = json.items[0].status.discoveredDevices;
    });
  });

  after(() => {
    cy.exec('kubectl delete namespace openshift-local-storage');
    cy.logout();
  });

  it('`Disks` tab is enabled and accessible', () => {
    cy.byLegacyTestID(localvolumediscoveryresults.nodeName).click();
    cy.byLegacyTestID('horizontal-link-Disks').contains('Disks');
    cy.byLegacyTestID('horizontal-link-Disks').click();
  });

  it('List title is `Disks`', () => {
    cy.byLegacyTestID('resource-title')
      .should('have.length', 2)
      .eq(1)
      .contains('Disks');
  });

  it('Rows are displayed with correct data format', () => {
    const devId = localvolumediscoveryresults.discoveredDevices[0].deviceID;
    cy.byTestRows('resource-row')
      .parent()
      .find('tr')
      .should('have.length', localvolumediscoveryresults.discoveredDevices.length);
    cy.byDataID(devId).contains('td', localvolumediscoveryresults.discoveredDevices[0].path);
    cy.byDataID(devId).contains(
      'td',
      localvolumediscoveryresults.discoveredDevices[0].status.state,
    );
    cy.byDataID(devId).contains('td', localvolumediscoveryresults.discoveredDevices[0].type || '-');
    cy.byDataID(devId).contains(
      'td',
      localvolumediscoveryresults.discoveredDevices[0].model || '-',
    );
    cy.byDataID(devId).contains(
      'td',
      localvolumediscoveryresults.discoveredDevices[0].fstype || '-',
    );
  });

  it('Text filter is accessible and working', () => {
    cy.byLegacyTestID('item-filter').type(localvolumediscoveryresults.discoveredDevices[0].path);
    cy.byTestRows('resource-row')
      .parent()
      .find('tr')
      .should('have.length', 1); // Only one unique macth should found
    cy.byDataID(localvolumediscoveryresults.discoveredDevices[0].deviceID).contains(
      'td',
      localvolumediscoveryresults.discoveredDevices[0].path,
    );
    cy.byLegacyTestID('item-filter').clear();
  });

  it('`Disk State` filter is accessible and working', () => {
    localvolumediscoveryresults.discoveredDevices.reduce(function(a, b) {
      diskStatusCount[b.status.state]++;
      return a;
    }, 0);
    testDiskSelection('Available', diskStatusCount.Available);
    testDiskSelection('NotAvailable', diskStatusCount.NotAvailable);
    testDiskSelection('Unknown', diskStatusCount.Unknown);
  });
});
