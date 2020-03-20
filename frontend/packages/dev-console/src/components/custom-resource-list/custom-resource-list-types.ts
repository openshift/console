import { FirehoseResult } from '@console/internal/components/utils';

export enum CustomResourceListFilterType {
  Row = 'row',
  Text = 'text',
}

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
  items: Promise<{ [key: string]: any }[]>;
  queryArg: string;
  rowFilters: CustomResourceListRowFilter[];
  resourceRow: React.ComponentType<CustomResourceListRowProps>;
  dependentResource?: FirehoseResult;
  resourceHeader: () => { [key: string]: any }[];
  getFilteredItems: (
    items: { [key: string]: any }[],
    filterType: CustomResourceListFilterType,
    filters: string | string[],
  ) => { [key: string]: any }[];
}
