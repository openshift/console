import { RootState } from '@console/internal/redux';

export enum ShowFiltersKeyValue {
  podCount = 'Pod Count',
  eventSources = 'Event Sources',
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

export type TopologyFilters = {
  display: DisplayFilters;
  searchQuery: SearchQuery;
};

export type SearchQuery = string;

export type DisplayFilters = {
  podCount: boolean;
  eventSources: boolean;
  showLabels: boolean;
  knativeServices: boolean;
  appGrouping: boolean;
  operatorGrouping: boolean;
  helmGrouping: boolean;
};
