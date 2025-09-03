import * as React from 'react';
import {
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTableBody,
} from '@patternfly/react-component-groups';
import { Bullseye, Pagination, Tooltip } from '@patternfly/react-core';
import {
  DataView,
  DataViewState,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
} from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { ColumnsIcon } from '@patternfly/react-icons';
import { InnerScrollContainer, Tbody, Td, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import {
  ColumnLayout,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { createColumnManagementModal } from '@console/internal/components/modals';
import { TableColumn } from '@console/internal/module/k8s';
import { EmptyBox } from '@console/shared/src/components/empty-state/EmptyBox';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { DataViewLabelFilter } from './DataViewLabelFilter';
import { ResourceFilters, GetDataViewRows } from './types';
import { useResourceDataViewData } from './useResourceDataViewData';
import { useResourceDataViewFilters } from './useResourceDataViewFilters';

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

/**
 * Console DataView component based on PatternFly DataView.
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
  const { t } = useTranslation();

  const { filters, onSetFilters, clearAllFilters, filteredData } = useResourceDataViewFilters<
    TData,
    TFilters
  >({
    data,
    initialFilters,
    matchesAdditionalFilters,
  });

  const { dataViewColumns, dataViewRows, pagination } = useResourceDataViewData<
    TData,
    TCustomRowData
  >({
    columns,
    filteredData,
    getDataViewRows,
    showNamespaceOverride,
    columnManagementID,
    customRowData,
  });

  const bodyLoading = React.useMemo(
    () => <SkeletonTableBody rowsCount={5} columnsCount={dataViewColumns.length} />,
    [dataViewColumns.length],
  );

  const bodyEmpty = React.useMemo(
    () => (
      <Tbody>
        <Tr>
          <Td colSpan={dataViewColumns.length}>
            <Bullseye>{t('public~No Pods found')}</Bullseye>
          </Td>
        </Tr>
      </Tbody>
    ),
    [t, dataViewColumns.length],
  );

  const activeState = React.useMemo(() => {
    if (!loaded) {
      return DataViewState.loading;
    }
    if (filteredData.length === 0) {
      return DataViewState.empty;
    }
    return undefined;
  }, [filteredData.length, loaded]);

  const dataViewFiltersNodes = React.useMemo<React.ReactNode[]>(() => {
    const basicFilters = [
      !hideNameLabelFilters && (
        <DataViewTextFilter key="name" filterId="name" title={t('public~Name')} />
      ),
      !hideNameLabelFilters && hideLabelFilter !== true && (
        <DataViewLabelFilter key="labels" filterId="label" title={t('public~Label')} data={data} />
      ),
    ];

    return additionalFilterNodes?.length > 0
      ? [...additionalFilterNodes, ...basicFilters]
      : basicFilters;

    // Can't use data in the deps array as it will recompute the filters and will cause the selected category to reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalFilterNodes, t]);

  return mock ? (
    <EmptyBox label={label} />
  ) : (
    <StatusBox
      label={label}
      data={filteredData}
      unfilteredData={data}
      loaded={loaded}
      loadError={loadError}
      skeleton={<div className="loading-skeleton--table" />}
    >
      <DataView activeState={activeState}>
        <DataViewToolbar
          filters={
            <DataViewFilters values={filters} onChange={(_e, values) => onSetFilters(values)}>
              {dataViewFiltersNodes}
            </DataViewFilters>
          }
          clearAllFilters={clearAllFilters}
          actions={
            !hideColumnManagement && (
              <ResponsiveActions breakpoint="lg">
                <ResponsiveAction
                  isPersistent
                  variant="plain"
                  onClick={() =>
                    createColumnManagementModal({
                      columnLayout,
                      noLimit: true,
                    })
                  }
                  aria-label={t('public~Column management')}
                  data-test="manage-columns"
                >
                  <Tooltip content={t('public~Manage columns')} trigger="mouseenter">
                    <ColumnsIcon />
                  </Tooltip>
                </ResponsiveAction>
              </ResponsiveActions>
            )
          }
          pagination={<Pagination itemCount={filteredData.length} {...pagination} />}
        />
        <InnerScrollContainer>
          <DataViewTable
            columns={dataViewColumns}
            rows={dataViewRows}
            bodyStates={{ empty: bodyEmpty, loading: bodyLoading }}
            gridBreakPoint=""
            variant="compact"
          />
        </InnerScrollContainer>
      </DataView>
    </StatusBox>
  );
};
