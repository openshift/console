export enum tabs {
  Overview = 'horizontal-link-Overview',
  Details = 'horizontal-link-Details',
  YAML = 'horizontal-link-public~YAML',
  Environment = 'horizontal-link-Environment',
  Events = 'horizontal-link-public~Events',
  Console = 'horizontal-link-Console',
  NetworkInterfaces = 'horizontal-link-Network Interfaces',
  Disks = 'horizontal-link-Disks',
  Snapshots = 'horizontal-link-Snapshots',
}

export const navigateToTab = (tab: string) => {
  cy.byLegacyTestID(tab).should('be.visible');
  cy.byLegacyTestID(tab).click();
};

export const tab = {
  navigateToOverview: () => {
    navigateToTab(tabs.Overview);
  },
  navigateToDetails: () => {
    navigateToTab(tabs.Details);
  },
  navigateToYAML: () => {
    navigateToTab(tabs.YAML);
  },
  navigateToEnvironment: () => {
    navigateToTab(tabs.Environment);
  },
  navigateToEvents: () => {
    navigateToTab(tabs.Events);
  },
  navigateToConsole: () => {
    navigateToTab(tabs.Console);
  },
  navigateToNetwork: () => {
    navigateToTab(tabs.NetworkInterfaces);
  },
  navigateToDisk: () => {
    navigateToTab(tabs.Disks);
  },
  navigateToSnapshot: () => {
    navigateToTab(tabs.Snapshots);
  },
};
