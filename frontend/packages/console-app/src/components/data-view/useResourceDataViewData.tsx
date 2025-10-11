import {
  K8sResourceCommon,
  TableColumn,
  RowProps,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  GeneralDataViewColumn,
  GetGeneralDataViewRows,
  GeneralFilters,
  GeneralRowProps,
  ResourceDataViewColumn,
  GetDataViewRows,
  ResourceFilters,
} from './types';
import { useGeneralDataViewData } from './useGeneralDataViewData';

// Type adapters to convert between resource types and general types
const adaptFiltersToGeneral = <TFilters extends ResourceFilters>(
  filters: TFilters,
): GeneralFilters => ({
  name: filters.name,
  label: filters.label,
});

const adaptColumnsFromGeneral = <TData extends K8sResourceCommon>(
  columns: GeneralDataViewColumn<TData>[],
): ResourceDataViewColumn<TData>[] => {
  return columns as ResourceDataViewColumn<TData>[];
};

const adaptGetDataViewRows = <TData extends K8sResourceCommon, TCustomRowData>(
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>,
): GetGeneralDataViewRows<TData, TCustomRowData> => {
  return (
    data: GeneralRowProps<TData, TCustomRowData>[],
    columns: GeneralDataViewColumn<TData>[],
  ) => {
    // Convert GeneralRowProps to RowProps
    const rowPropsData: RowProps<TData, TCustomRowData>[] = data.map((item) => ({
      obj: item.obj,
      rowData: item.rowData,
      activeColumnIDs: item.activeColumnIDs,
      index: item.index,
    }));

    // Convert GeneralDataViewColumn to ResourceDataViewColumn
    const resourceColumns = columns as ResourceDataViewColumn<TData>[];

    return getDataViewRows(rowPropsData, resourceColumns);
  };
};

export const useResourceDataViewData = <
  TData extends K8sResourceCommon = K8sResourceCommon,
  TCustomRowData = any,
  TFilters extends ResourceFilters = ResourceFilters
>({
  columns,
  filteredData,
  filters,
  getDataViewRows,
  showNamespaceOverride,
  columnManagementID,
  customRowData,
}: {
  columns: TableColumn<TData>[];
  filteredData: TData[];
  filters: TFilters;
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>;
  showNamespaceOverride?: boolean;
  columnManagementID?: string;
  customRowData?: TCustomRowData;
}) => {
  // Use the general data view hook with type adapters
  const generalResult = useGeneralDataViewData({
    columns,
    filteredData,
    filters: adaptFiltersToGeneral(filters),
    getDataViewRows: adaptGetDataViewRows(getDataViewRows),
    showNamespaceOverride,
    columnManagementID,
    customRowData,
  });

  // Adapt the result back to resource-specific types
  return {
    dataViewRows: generalResult.dataViewRows,
    dataViewColumns: adaptColumnsFromGeneral(generalResult.dataViewColumns),
    pagination: generalResult.pagination,
  };
};
