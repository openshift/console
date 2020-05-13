import { RowFunction } from '@console/internal/components/factory';
import { SortByDirection } from '@patternfly/react-table';
import { RowFilter } from '@console/internal/components/filter-toolbar';

export interface CustomResourceListProps {
  queryArg?: string;
  rowFilters?: RowFilter[];
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
  textFilter?: string;
  textFilterReducer?: (
    items: { [key: string]: any }[],
    filters: string,
  ) => { [key: string]: any }[];
}
