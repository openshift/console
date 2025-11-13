import { DataViewTh, DataViewTd } from '@patternfly/react-data-view';
import { SortByDirection } from '@patternfly/react-table';
import { RowProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export type ResourceFilters = {
  name: string;
  label: string;
};

export type ResourceMetadata = {
  name: string;
  labels?: { [key: string]: string };
};

export type ConsoleDataViewColumn<TData> = DataViewTh & {
  id: string;
  title: string;
  sortFunction?: string | ((filteredData: TData[], sortDirection: SortByDirection) => TData[]);
};

export type ConsoleDataViewRow = DataViewTd[];

/**
 * Maps Console `RowProps` data to DataView compatible format.
 */
export type GetDataViewRows<TData, TCustomRowData = any> = (
  data: RowProps<TData, TCustomRowData>[],
  columns: ConsoleDataViewColumn<TData>[],
) => ConsoleDataViewRow[];
