import { SortByDirection } from '@patternfly/react-table';

export interface CustomResourceListRowFilter {
  type: string;
  selected: string[];
  reducer: (item: { [key: string]: any }) => string;
  items: { [key: string]: any }[];
}

export interface CustomResourceListRowProps {
  obj: { [key: string]: any };
  index: number;
  key?: string;
  style: object;
}

export interface CustomResourceListProps {
  queryArg: string;
  rowFilters: CustomResourceListRowFilter[];
  sortBy: string;
  sortOrder: SortByDirection;
  resourceRow: React.ComponentType<CustomResourceListRowProps>;
  dependentResource?: any;
  resourceHeader: () => { [key: string]: any }[];
  fetchCustomResources: () => Promise<{ [key: string]: any }[]>;
  rowFilterReducer: (
    items: { [key: string]: any }[],
    filters: string | string[],
  ) => { [key: string]: any }[];
}
