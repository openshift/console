import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState, useEffect } from 'react';
import './ConsoleDataView.scss';
import {
  BulkSelect,
  BulkSelectValue,
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTableBody,
} from '@patternfly/react-component-groups';
import { Bullseye, Pagination, Tooltip } from '@patternfly/react-core';
import {
  DataView,
  DataViewState,
  DataViewTable,
  DataViewToolbar,
} from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/esm/DataViewFilters';
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
  bulkSelect,
  bulkActions,
  selection,
  actionsBreakpoint = 'lg',
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

  // Notify parent of filtered selected items when filters or selection changes
  useEffect(() => {
    if (selection?.onFilteredSelectionChange) {
      const filteredSelectedItems = filteredData.filter((item) =>
        selection.selectedItems.has(selection.getItemId(item)),
      );
      selection.onFilteredSelectionChange(filteredSelectedItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filteredData,
    selection?.selectedItems,
    selection?.getItemId,
    selection?.onFilteredSelectionChange,
  ]);

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

  // Create bulkSelect component if selection is provided but bulkSelect prop is not
  let defaultBulkSelect = null;
  if (selection?.onSelectAll && !bulkSelect) {
    const totalCount = filteredData.length;
    const pageCount = dataViewRows.length;
    // Count only selected items that are in the current filtered dataset
    const selectedCount = filteredData.filter((item) =>
      selection.selectedItems.has(selection.getItemId(item)),
    ).length;

    const handleBulkSelect = (value: BulkSelectValue) => {
      if (value === BulkSelectValue.all || value === BulkSelectValue.page) {
        selection.onSelectAll(true, filteredData);
      } else if (value === BulkSelectValue.none || value === BulkSelectValue.nonePage) {
        selection.onSelectAll(false, filteredData);
      }
    };

    defaultBulkSelect = (
      <BulkSelect
        pageCount={pageCount}
        selectedCount={selectedCount}
        totalCount={totalCount}
        onSelect={handleBulkSelect}
        canSelectAll
        selectNoneLabel={t('public~Select none (0)')}
        selectPageLabel={(itemCount) =>
          `${t('public~Select page')}${itemCount ? ` (${itemCount})` : ''}`
        }
        selectAllLabel={(itemCount) =>
          `${t('public~Select all')}${itemCount ? ` (${itemCount})` : ''}`
        }
        selectedLabel={(itemCount) => t('public~{{itemCount}} selected', { itemCount })}
      />
    );
  }

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
      <DataView
        activeState={activeState}
        className={css(dataViewFilterNodes.length === 1 && 'co-console-data-view-single-filter')}
      >
        <DataViewToolbar
          bulkSelect={bulkSelect ?? defaultBulkSelect}
          filters={
            dataViewFilterNodes.length > 0 && (
              <DataViewFilters values={filters} onChange={(_e, values) => onSetFilters(values)}>
                {dataViewFilterNodes}
              </DataViewFilters>
            )
          }
          clearAllFilters={clearAllFilters}
          actions={
            <ResponsiveActions breakpoint={actionsBreakpoint}>
              {bulkActions}
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
            <Pagination
              itemCount={filteredData.length}
              titles={{
                ofWord: t('public~of'),
                itemsPerPage: t('public~Items per page'),
                perPageSuffix: t('public~per page'),
              }}
              {...pagination}
            />
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
      </DataView>
    </StatusBox>
  );
};

export const SELECTION_COLUMN_WIDTH = '45px';

export const cellIsStickyProps = {
  isStickyColumn: true,
  stickyMinWidth: '0',
};

export const selectionColumnProps = {
  ...cellIsStickyProps,
  stickyLeftOffset: '0',
};

export const nameCellProps = {
  ...cellIsStickyProps,
  hasRightBorder: true,
};

/**
 * Returns name column props with appropriate offset based on whether bulk select is enabled.
 * Use this for column definitions.
 * @param hasRightBorder - Whether to include hasRightBorder (default: true)
 * @param withBulkSelect - Whether the table has bulk selection enabled (default: false)
 */
export const getNameColumnProps = (hasRightBorder = true, withBulkSelect = false) => ({
  ...cellIsStickyProps,
  ...(hasRightBorder && { hasRightBorder: true }),
  ...(withBulkSelect && { stickyLeftOffset: SELECTION_COLUMN_WIDTH }),
});

/**
 * Returns name cell props with appropriate offset based on whether bulk select is enabled.
 * Use this for row cell definitions.
 * @param name - The name to use in the data-test attribute
 * @param withBulkSelect - Whether the table has bulk selection enabled (default: false)
 */
export const getNameCellProps = (name: string, withBulkSelect = false) => ({
  ...getNameColumnProps(true, withBulkSelect),
  'data-test': `data-view-cell-${name}-name`,
});

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
