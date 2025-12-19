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
import { ColumnLayout } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { createColumnManagementModal } from '@console/internal/components/modals';
import { TableColumn } from '@console/internal/module/k8s';
import { EmptyBox } from '@console/shared/src/components/empty-state/EmptyBox';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { DataViewLabelFilter } from './DataViewLabelFilter';
import { ResourceFilters, ResourceMetadata, GetDataViewRows } from './types';
import { useConsoleDataViewData } from './useConsoleDataViewData';
import { useConsoleDataViewFilters } from './useConsoleDataViewFilters';

export const initialFiltersDefault: ResourceFilters = { name: '', label: '' };

export type ConsoleDataViewProps<
  TData,
  TCustomRowData = any,
  TFilters extends ResourceFilters = ResourceFilters
> = {
  label?: string;
  data: TData[];
  loaded: boolean;
  loadError?: any;
  columns: TableColumn<TData>[];
  columnLayout?: ColumnLayout;
  columnManagementID?: string;
  initialFilters?: TFilters;
  additionalFilterNodes?: React.ReactNode[];
  /**
   * By default, `TData` is assumed to be assignable to `K8sResourceCommon` type.
   *
   * This function overrides the default getters for the metadata of `TData` objects.
   */
  getObjectMetadata?: (obj: TData) => ResourceMetadata;
  matchesAdditionalFilters?: (obj: TData, filters: TFilters) => boolean;
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>;
  customRowData?: TCustomRowData;
  showNamespaceOverride?: boolean;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
  mock?: boolean;
};

export const BodyLoading: Snail.FCC<{ columns: number }> = ({ columns }) => {
  return <SkeletonTableBody rowsCount={5} columnsCount={columns} />;
};

export const BodyEmpty: Snail.FCC<{ label: string; colSpan: number }> = ({ label, colSpan }) => {
  const { t } = useTranslation();
  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan}>
          <Bullseye>
            {label ? t('public~No {{label}} found', { label }) : t('public~None found')}
          </Bullseye>
        </Td>
      </Tr>
    </Tbody>
  );
};

/**
 * Console DataView component based on PatternFly DataView.
 */
export const ConsoleDataView = <
  TData,
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
  initialFilters = initialFiltersDefault as TFilters,
  additionalFilterNodes,
  getObjectMetadata,
  matchesAdditionalFilters,
  getDataViewRows,
  customRowData,
  showNamespaceOverride,
  hideNameLabelFilters,
  hideLabelFilter,
  hideColumnManagement,
  mock,
}: ConsoleDataViewProps<TData, TCustomRowData, TFilters>) => {
  const { t } = useTranslation();

  const { filters, onSetFilters, clearAllFilters, filteredData } = useConsoleDataViewFilters<
    TData,
    TFilters
  >({
    data,
    initialFilters,
    getObjectMetadata,
    matchesAdditionalFilters,
  });

  const { dataViewColumns, dataViewRows, pagination } = useConsoleDataViewData<
    TData,
    TCustomRowData,
    TFilters
  >({
    columns,
    filteredData,
    filters,
    getDataViewRows,
    showNamespaceOverride,
    columnManagementID,
    customRowData,
  });

  const bodyLoading = React.useMemo(() => <BodyLoading columns={dataViewColumns.length} />, [
    dataViewColumns.length,
  ]);

  const bodyEmpty = React.useMemo(
    () => <BodyEmpty label={label} colSpan={dataViewColumns.length} />,
    [dataViewColumns.length, label],
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

  const dataViewFilterNodes = React.useMemo<React.ReactNode[]>(() => {
    const basicFilters: React.ReactNode[] = [];

    if (!hideNameLabelFilters) {
      basicFilters.push(
        <DataViewTextFilter
          key="name"
          filterId="name"
          title={t('public~Name')}
          placeholder={t('public~Filter by name')}
        />,
      );
    }

    if (!hideNameLabelFilters && !hideLabelFilter && loaded) {
      basicFilters.push(
        <DataViewLabelFilter key="label" filterId="label" title={t('public~Label')} data={data} />,
      );
    }

    return additionalFilterNodes?.length > 0
      ? [...additionalFilterNodes, ...basicFilters]
      : basicFilters;

    // Can't use data in the deps array as it will recompute the filters and will cause the selected category to reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalFilterNodes, t, loaded]);

  return mock ? (
    <EmptyBox label={label} />
  ) : (
    <StatusBox
      label={label}
      data={data}
      loaded={loaded}
      loadError={loadError}
      skeleton={<div className="loading-skeleton--table" />}
    >
      <DataView activeState={activeState}>
        <DataViewToolbar
          filters={
            dataViewFilterNodes.length > 0 && (
              <DataViewFilters values={filters} onChange={(_e, values) => onSetFilters(values)}>
                {dataViewFilterNodes}
              </DataViewFilters>
            )
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
            aria-label={t(`public~{{label}} table`, { label })}
            columns={dataViewColumns}
            rows={dataViewRows}
            bodyStates={{ empty: bodyEmpty, loading: bodyLoading }}
            gridBreakPoint=""
            variant="compact"
            data-test="data-view-table"
          />
        </InnerScrollContainer>
      </DataView>
    </StatusBox>
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
