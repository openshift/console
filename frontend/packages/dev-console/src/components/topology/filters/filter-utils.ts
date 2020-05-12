import { RootState } from '@console/internal/redux';
import { getQueryArgument } from '@console/internal/components/utils';

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

export const getTopologyFilters = ({
  plugins: {
    devconsole: { topology },
  },
}: RootState): TopologyFilters => topology.get('filters');

export const getTopologySearchQuery = () => getQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY) ?? '';

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
