import { DataViewTh, DataViewTd } from '@patternfly/react-data-view';
import { SortByDirection } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  RowProps,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export type ResourceFilters = {
  name: string;
  label: string;
};

export type ResourceDataViewColumn<
  TData extends K8sResourceCommon = K8sResourceCommon
> = DataViewTh & {
  id: string;
  title: string;
  sortFunction?: string | ((filteredData: TData[], sortDirection: SortByDirection) => TData[]);
};

export type ResourceDataViewRow = DataViewTd[];

/**
 * Maps Console `RowProps` data to DataView compatible format.
 */
export type GetDataViewRows<TData, TCustomRowData> = (
  data: RowProps<TData, TCustomRowData>[],
  columns: ResourceDataViewColumn<TData>[],
) => ResourceDataViewRow[];
