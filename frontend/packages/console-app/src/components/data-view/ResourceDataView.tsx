import * as React from 'react';
import {
  ColumnLayout,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { TableColumn } from '@console/internal/module/k8s';
import { getLabelsAsString } from '@console/shared/src/utils/label-filter';
import { GeneralDataView } from './GeneralDataView';
import { GeneralFilters, GetGeneralDataViewRows, ResourceFilters, GetDataViewRows } from './types';

export type ResourceDataViewProps<TData, TCustomRowData, TFilters> = {
  label?: string;
  data: TData[];
  loaded: boolean;
  loadError?: any;
  columns: TableColumn<TData>[];
  columnLayout?: ColumnLayout;
  columnManagementID?: string;
  initialFilters: TFilters;
  additionalFilterNodes?: React.ReactNode[];
  matchesAdditionalFilters?: (resource: TData, filters: TFilters) => boolean;
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>;
  customRowData?: TCustomRowData;
  showNamespaceOverride?: boolean;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
  mock?: boolean;
};

export { BodyLoading, BodyEmpty, initialFiltersDefault } from './GeneralDataView';

/**
 * Console DataView component based on PatternFly DataView.
 * This component is now a wrapper around GeneralDataView that provides K8s-specific functionality.
 */
export const ResourceDataView = <
  TData extends K8sResourceCommon = K8sResourceCommon,
  TCustomRowData = any,
  TFilters extends ResourceFilters = ResourceFilters
>({
  label,
  data,
  loaded,
  loadError,
  columns,
  columnLayout,
  columnManagementID,
  initialFilters,
  additionalFilterNodes,
  matchesAdditionalFilters,
  getDataViewRows,
  customRowData,
  showNamespaceOverride,
  hideNameLabelFilters,
  hideLabelFilter,
  hideColumnManagement,
  mock,
}: ResourceDataViewProps<TData, TCustomRowData, TFilters>) => {
  // Convert GetDataViewRows to GetGeneralDataViewRows
  const getGeneralDataViewRows: GetGeneralDataViewRows<TData, TCustomRowData> = (
    rowData: any[],
    dataViewColumns: any[],
  ) => {
    return getDataViewRows(rowData, dataViewColumns);
  };

  // Convert matchesAdditionalFilters to work with GeneralFilters
  const matchesGeneralAdditionalFilters = matchesAdditionalFilters
    ? (resource: TData, filters: GeneralFilters) => {
        const resourceFilters: TFilters = {
          ...filters,
        } as TFilters;
        return matchesAdditionalFilters(resource, resourceFilters);
      }
    : undefined;

  return (
    <GeneralDataView
      label={label}
      data={data}
      loaded={loaded}
      loadError={loadError}
      columns={columns}
      columnLayout={columnLayout}
      columnManagementID={columnManagementID}
      initialFilters={initialFilters}
      additionalFilterNodes={additionalFilterNodes}
      matchesAdditionalFilters={matchesGeneralAdditionalFilters}
      getDataViewRows={getGeneralDataViewRows}
      customRowData={customRowData}
      showNamespaceOverride={showNamespaceOverride}
      hideNameLabelFilters={hideNameLabelFilters}
      hideLabelFilter={hideLabelFilter}
      hideColumnManagement={hideColumnManagement}
      mock={mock}
      getNameFromItem={(item: TData) => item.metadata?.name || ''}
      getLabelsAsString={(item: TData) => getLabelsAsString(item).join(', ')}
    />
  );
};

export const cellIsStickyProps = {
  isStickyColumn: true,
  stickyMinWidth: '0',
};

const nameCellProps = {
  ...cellIsStickyProps,
  hasRightBorder: true,
};

export const getNameCellProps = (name: string) => {
  return {
    ...nameCellProps,
    'data-test': `data-view-cell-${name}-name`,
  };
};

export const actionsCellProps = {
  ...cellIsStickyProps,
  hasLeftBorder: true,
  isActionCell: true,
};
