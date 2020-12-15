export const TOPOLOGY_SEARCH_FILTER_KEY = 'searchQuery';
export const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';

export enum ShowFiltersKeyValue {
  podCount = 'Pod Count',
  eventSources = 'Event Sources',
  virtualMachines = 'Virtual Machines',
  showLabels = 'Show Labels',
}

export enum ExpandFiltersKeyValue {
  appGrouping = 'Application Groupings',
  helmGrouping = 'Helm Releases',
  knativeServices = 'Knative Services',
  operatorGrouping = 'Operator Groupings',
}

export type TopologyFilters = {
  display: DisplayFilters;
};

export type DisplayFilters = {
  podCount: boolean;
  eventSources: boolean;
  virtualMachines: boolean;
  showLabels: boolean;
  knativeServices: boolean;
  appGrouping: boolean;
  operatorGrouping: boolean;
  helmGrouping: boolean;
};
