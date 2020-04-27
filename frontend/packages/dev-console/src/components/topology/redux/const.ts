export const TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY = `bridge/topology-display-filters`;
export const TOPOLOGY_SEARCH_FILTER_KEY = 'searchQuery';
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
