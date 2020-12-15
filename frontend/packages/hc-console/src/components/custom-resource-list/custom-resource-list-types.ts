import * as React from 'react';
import { RowFunction } from '@console/internal/components/factory';
import { SortByDirection } from '@patternfly/react-table';
import { RowFilter } from '@console/internal/components/filter-toolbar';

export interface CustomResourceListProps {
  queryArg?: string;
  rowFilters?: RowFilter[];
  sortBy: string;
  sortOrder: SortByDirection;
  resourceRow: RowFunction;
  resources?: { [key: string]: any }[];
  resourceHeader: () => { [key: string]: any }[];
  EmptyMsg?: React.ComponentType;
  loaded?: boolean;
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
