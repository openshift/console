import { RowFunction } from '@console/internal/components/factory';
import { SortByDirection } from '@patternfly/react-table';

export interface CustomResourceListRowFilter {
  type: string;
  selected: string[];
  reducer: (item: { [key: string]: any }) => string;
  items: { [key: string]: any }[];
}

export interface CustomResourceListProps {
  queryArg?: string;
  rowFilters?: CustomResourceListRowFilter[];
  sortBy: string;
  sortOrder: SortByDirection;
  resourceRow: RowFunction;
  dependentResource?: any;
  resourceHeader: () => { [key: string]: any }[];
  fetchCustomResources: () => Promise<{ [key: string]: any }[]>;
  rowFilterReducer?: (
    items: { [key: string]: any }[],
    filters: string | string[],
  ) => { [key: string]: any }[];
  textFilterReducer?: (
    items: { [key: string]: any }[],
    filters: string,
  ) => { [key: string]: any }[];
}
