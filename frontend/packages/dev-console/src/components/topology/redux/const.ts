export const TOPOLOGGY_FILTERS_LOCAL_STORAGE_KEY = `bridge/topology-filters`;
export const DEFAULT_TOPOLOGY_FILTERS = {
  display: {
    podCount: false,
    eventSources: true,
    virtualMachines: true,
    showLabels: true,
    knativeServices: true,
    appGrouping: true,
    operatorGrouping: true,
    helmGrouping: true,
  },
  searchQuery: '',
};
