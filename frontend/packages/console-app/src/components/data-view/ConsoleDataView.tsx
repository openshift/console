import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import './ConsoleDataView.scss';
import {
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTableBody,
} from '@patternfly/react-component-groups';
import { Bullseye, Pagination, PaginationVariant, Tooltip } from '@patternfly/react-core';
import {
  DataView,
  DataViewFilters,
  DataViewState,
  DataViewTable,
  DataViewToolbar,
} from '@patternfly/react-data-view';
import { ColumnsIcon, UndoIcon } from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import { InnerScrollContainer, Tbody, Td, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import type {
  ResourceFilters,
  ConsoleDataViewProps,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { LazyColumnManagementModalOverlay } from '@console/internal/components/modals';
import { EmptyBox } from '@console/shared/src/components/empty-state/EmptyBox';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { DataViewLabelFilter } from './DataViewLabelFilter';
import { DataViewTextFilter } from './DataViewTextFilter';
import { useConsoleDataViewData } from './useConsoleDataViewData';
import { useConsoleDataViewFilters } from './useConsoleDataViewFilters';

export const initialFiltersDefault: ResourceFilters = { name: '', label: '' };

export const BodyLoading: FC<{ columns: number }> = ({ columns }) => {
  return <SkeletonTableBody rowsCount={5} columnsCount={columns} />;
};

export const BodyEmpty: FC<{ label: string; colSpan: number }> = ({ label, colSpan }) => {
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
  isResizable,
  resetAllColumnWidths,
}: ConsoleDataViewProps<TData, TCustomRowData, TFilters>) => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const [tableKey, setTableKey] = useState(0);

  const handleResetColumnWidths = useCallback(() => {
    resetAllColumnWidths?.();
    setTableKey((k) => k + 1);
  }, [resetAllColumnWidths]);

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
    isResizable,
  });

  const bodyLoading = useMemo(() => <BodyLoading columns={dataViewColumns.length} />, [
    dataViewColumns.length,
  ]);

  const bodyEmpty = useMemo(() => <BodyEmpty label={label} colSpan={dataViewColumns.length} />, [
    dataViewColumns.length,
    label,
  ]);

  const activeState = useMemo(() => {
    if (!loaded) {
      return DataViewState.loading;
    }
    if (filteredData.length === 0) {
      return DataViewState.empty;
    }
    return undefined;
  }, [filteredData.length, loaded]);

  const paginationTitles = useMemo(
    () => ({
      ofWord: t('public~of'),
      itemsPerPage: t('public~Items per page'),
      perPageSuffix: t('public~per page'),
      toFirstPageAriaLabel: t('public~Go to first page'),
      toPreviousPageAriaLabel: t('public~Go to previous page'),
      toNextPageAriaLabel: t('public~Go to next page'),
      toLastPageAriaLabel: t('public~Go to last page'),
    }),
    [t],
  );

  const dataViewFilterNodes = useMemo<React.ReactNode[]>(() => {
    const basicFilters: ReactNode[] = [];

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
      ? [...basicFilters, ...additionalFilterNodes]
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
      <DataView
        activeState={activeState}
        className={css(dataViewFilterNodes.length === 1 && 'co-console-data-view-single-filter')}
      >
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
            <ResponsiveActions breakpoint="lg">
              {!hideColumnManagement && (
                <ResponsiveAction
                  isPersistent
                  variant="plain"
                  onClick={() =>
                    launchModal(LazyColumnManagementModalOverlay, {
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
              )}
              {isResizable && resetAllColumnWidths && (
                <ResponsiveAction
                  isPersistent
                  variant="plain"
                  onClick={handleResetColumnWidths}
                  aria-label={t('public~Reset column widths')}
                  data-test="reset-column-widths"
                >
                  <Tooltip content={t('public~Reset column widths')} trigger="mouseenter">
                    <UndoIcon />
                  </Tooltip>
                </ResponsiveAction>
              )}
            </ResponsiveActions>
          }
          pagination={
            <Pagination itemCount={filteredData.length} titles={paginationTitles} {...pagination} />
          }
        />
        <InnerScrollContainer>
          <DataViewTable
            key={tableKey}
            aria-label={t(`public~{{label}} table`, { label })}
            // @ts-expect-error - TODO(react18): CONSOLE-5040: Remove ConsoleDataViewColumn bodge
            columns={dataViewColumns}
            rows={dataViewRows}
            bodyStates={{ empty: bodyEmpty, loading: bodyLoading }}
            gridBreakPoint=""
            variant="compact"
            data-test="data-view-table"
            isResizable={isResizable}
          />
        </InnerScrollContainer>
        <DataViewToolbar
          pagination={
            <Pagination
              itemCount={filteredData.length}
              titles={paginationTitles}
              variant={PaginationVariant.bottom}
              {...pagination}
            />
          }
        />
      </DataView>
    </StatusBox>
  );
};

export const cellIsStickyProps = {
  isStickyColumn: true,
  stickyMinWidth: '0',
};

export const nameCellProps = {
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

/**
 * Returns the style prop for a Labels column so it can be shared across tables.
 * @param width - Persisted or current width in pixels (e.g. from getWidth(columnId))
 * @param defaultWidth - Default width when no width is provided (default 200)
 * @returns Style object for the column's props.style
 */
export const getLabelsColumnWidthStyleProp = (width: number | undefined, defaultWidth = 200) => ({
  style: {
    width: `${width ?? defaultWidth}px`,
  },
});
