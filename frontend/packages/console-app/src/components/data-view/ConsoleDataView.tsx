import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTableBody,
} from '@patternfly/react-component-groups';
import {
  Banner,
  Bullseye,
  Button,
  Pagination,
  PaginationVariant,
  Tooltip,
} from '@patternfly/react-core';
import {
  DataView,
  DataViewFilters,
  DataViewState,
  DataViewTable,
  DataViewToolbar,
} from '@patternfly/react-data-view';
import { RhUiColumnsIcon, RhUiUndoIcon } from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import { InnerScrollContainer, Tbody, Td, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type {
  ResourceFilters,
  ConsoleDataViewProps,
  GetDataViewRows,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LazyColumnManagementModalOverlay } from '@console/internal/components/modals/lazy-column-management-modal';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { EmptyBox } from '@console/shared/src/components/empty-state/EmptyBox';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { DataViewLabelFilter } from './DataViewLabelFilter';
import { createSelectionCell, createSelectionColumn } from './dataViewSelectionHelpers';
import { DataViewTextFilter } from './DataViewTextFilter';
import { getConsoleDataViewID } from './getConsoleDataViewID';
import { getResourceReferenceForItems, getSelectedResources } from './resourceActions';
import { ResourceBulkActionMenu } from './ResourceBulkActionMenu';
import { useConsoleDataViewColumns } from './useConsoleDataViewColumns';
import { useConsoleDataViewData } from './useConsoleDataViewData';
import { useConsoleDataViewFilters } from './useConsoleDataViewFilters';
import { useDataViewSelection } from './useDataViewSelection';

import './ConsoleDataView.scss';

const BodyLoading: FC<{ columns: number }> = ({ columns }) => (
  <SkeletonTableBody rowsCount={5} columnsCount={columns} />
);

const BodyEmpty: FC<{ label: string; colSpan: number }> = ({ label, colSpan }) => {
  const { t } = useTranslation('console-app');
  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan}>
          <Bullseye>{label ? t('No {{label}} found', { label }) : t('None found')}</Bullseye>
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
  TFilters extends ResourceFilters = ResourceFilters,
>({
  label,
  data,
  loaded,
  loadError,
  columns,
  columnLayout,
  id,
  initialFilters,
  additionalFilterNodes,
  getObjectMetadata,
  matchesAdditionalFilters,
  getDataViewRows,
  customRowData,
  defaultSortColumnId,
  defaultSortDirection,
  showNamespaceOverride,
  hideNameLabelFilters,
  hideLabelFilter,
  EmptyMsg,
  mock,
  isResizable = true,
  additionalActions,
  customActions,
  selection,
}: ConsoleDataViewProps<TData, TCustomRowData, TFilters>) => {
  const { t } = useTranslation('console-app');
  const launchModal = useOverlay();
  const [tableKey, setTableKey] = useState(0);
  const resolvedID = getConsoleDataViewID(id);
  const selectionEnabled = Boolean(selection);
  const getItemId = selection?.getItemId;
  const isSelectable = selection?.isSelectable;
  const getActions = selection?.getActions;
  const { selectedIds, onSelectItem, onSelectAll, clearSelection, deselect } = useDataViewSelection(
    {
      data,
      getItemId,
      isSelectable,
    },
  );
  const tableColumns = useMemo(
    () => (selectionEnabled ? [createSelectionColumn<TData>(), ...columns] : columns),
    [columns, selectionEnabled],
  );
  const getRowsWithResourceActions = useCallback<GetDataViewRows<TData, TCustomRowData>>(
    (rows, activeColumns) => {
      const contentRows = getDataViewRows(rows, activeColumns);
      const actionIndex = activeColumns.findIndex(({ type }) => type === 'actions');
      if (actionIndex < 0) return contentRows;

      return contentRows.map((cells, rowIndex) => {
        const actionCell = cells[actionIndex];
        if (
          actionCell !== undefined &&
          (actionCell === null ||
            typeof actionCell !== 'object' ||
            !('id' in actionCell) ||
            actionCell.cell !== undefined)
        ) {
          return cells;
        }
        const resource = rows[rowIndex]?.obj;
        const resourceReference = getResourceReference(resource);
        const nextCells = [...cells];
        if (!resourceReference) {
          nextCells[actionIndex] = {
            ...actionCell,
            id: activeColumns[actionIndex].id,
            cell: null,
          };
          return nextCells;
        }
        nextCells[actionIndex] = {
          ...actionCell,
          id: activeColumns[actionIndex].id,
          cell: <LazyActionMenu context={{ [resourceReference]: resource }} />,
        };
        return nextCells;
      });
    },
    [getDataViewRows],
  );
  const getRowsWithSelection = useCallback<GetDataViewRows<TData, TCustomRowData>>(
    (rows, activeColumns) => {
      if (!selectionEnabled || !getItemId) {
        return getRowsWithResourceActions(rows, activeColumns);
      }
      const selectionIndex = activeColumns.findIndex(({ id: columnID }) => columnID === 'select');
      if (selectionIndex < 0) return getRowsWithResourceActions(rows, activeColumns);
      const contentColumns = activeColumns.filter(({ id: columnID }) => columnID !== 'select');
      const contentRows = getRowsWithResourceActions(rows, contentColumns);
      return rows.map(({ obj }, rowIndex) => {
        const itemId = getItemId(obj);
        const cell = {
          id: 'select',
          ...createSelectionCell({
            rowIndex,
            itemId,
            isSelected: selectedIds.has(itemId),
            onSelect: onSelectItem,
            disabled: isSelectable ? !isSelectable(obj) : false,
          }),
        };
        const contentRow = contentRows[rowIndex];
        return [...contentRow.slice(0, selectionIndex), cell, ...contentRow.slice(selectionIndex)];
      });
    },
    [
      getRowsWithResourceActions,
      selectionEnabled,
      getItemId,
      isSelectable,
      selectedIds,
      onSelectItem,
    ],
  );
  const managedColumnLayout = useMemo(
    () => (columnLayout ? { ...columnLayout, id: resolvedID } : undefined),
    [columnLayout, resolvedID],
  );
  const preparedTable = useConsoleDataViewColumns(
    tableColumns,
    managedColumnLayout,
    resolvedID,
    getRowsWithSelection,
    getObjectMetadata,
    isResizable,
  );
  const { resetColumnWidths } = preparedTable;
  const canResetColumnWidths =
    isResizable && preparedTable.columns.some(({ resizableProps }) => resizableProps?.isResizable);

  const handleResetColumnWidths = useCallback(() => {
    resetColumnWidths();
    setTableKey((k) => k + 1);
  }, [resetColumnWidths]);

  const { filters, onSetFilters, clearAllFilters, filteredData } = useConsoleDataViewFilters<
    TData,
    TFilters
  >({
    data,
    initialFilters,
    getObjectMetadata,
    matchesAdditionalFilters,
  });

  const selectableFilteredData = useMemo(
    () => (isSelectable ? filteredData.filter(isSelectable) : filteredData),
    [filteredData, isSelectable],
  );
  const filteredSelectedItems = useMemo(
    () =>
      selectionEnabled && getItemId
        ? selectableFilteredData.filter((item) => selectedIds.has(getItemId(item)))
        : [],
    [selectableFilteredData, selectedIds, selectionEnabled, getItemId],
  );
  const bulkActions = useMemo(
    () =>
      getActions?.({
        selectedItems: filteredSelectedItems,
        clearSelection,
        deselect,
      }),
    [getActions, filteredSelectedItems, clearSelection, deselect],
  );
  const selectedResources = useMemo(
    () => getSelectedResources(filteredSelectedItems),
    [filteredSelectedItems],
  );
  const bulkActionReference = useMemo(() => {
    if (filteredSelectedItems.length > 0) return selectedResources?.reference;
    return getResourceReferenceForItems(data, isSelectable);
  }, [data, filteredSelectedItems.length, selectedResources, isSelectable]);
  const getResourceId = useCallback(
    (resource: K8sResourceCommon) => getItemId?.(resource as TData) ?? '',
    [getItemId],
  );
  const selectionKey =
    selectionEnabled && getItemId ? JSON.stringify(filteredSelectedItems.map(getItemId)) : '';
  const selectionState = useMemo(
    () =>
      selectionEnabled && getItemId
        ? { selectedItems: selectedIds, onSelectAll, getItemId, isSelectable }
        : undefined,
    [selectionEnabled, selectedIds, onSelectAll, getItemId, isSelectable],
  );

  const { dataViewColumns, dataViewRows, pagination, visibleItems } = useConsoleDataViewData<
    TData,
    TCustomRowData,
    TFilters
  >({
    columns: preparedTable.columns,
    filteredData,
    filters,
    getDataViewRows: preparedTable.getDataViewRows,
    defaultSortColumnId,
    defaultSortDirection,
    showNamespaceOverride,
    columnManagementID: resolvedID,
    customRowData,
    isResizable,
    selection: selectionState,
  });

  const bodyLoading = useMemo(
    () => <BodyLoading columns={dataViewColumns.length} />,
    [dataViewColumns.length],
  );

  const bodyEmpty = useMemo(
    () => <BodyEmpty label={label} colSpan={dataViewColumns.length} />,
    [dataViewColumns.length, label],
  );

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
      paginationAriaLabel: t('Pagination'),
      ofWord: t('of'),
      itemsPerPage: t('Items per page'),
      perPageSuffix: t('per page'),
      optionsToggleAriaLabel: t('Items per page'),
      toPreviousPageAriaLabel: t('Go to previous page'),
      toNextPageAriaLabel: t('Go to next page'),
    }),
    [t],
  );

  // Calculate whether to show the "select all" banner
  const bannerState = useMemo(() => {
    if (!selectionEnabled || !getItemId || !loaded || selectableFilteredData.length === 0) {
      return { show: false, allSelected: false };
    }

    const selectableVisibleItems = isSelectable ? visibleItems.filter(isSelectable) : visibleItems;
    const allVisibleSelected = selectableVisibleItems.every((item) =>
      selectedIds.has(getItemId(item)),
    );

    const visibleCount = selectableVisibleItems.length;
    const totalCount = selectableFilteredData.length;
    const selectedCount = filteredSelectedItems.length;

    // Show banner if all visible items are selected and there are more items than visible
    const shouldShow = allVisibleSelected && visibleCount > 0 && totalCount > visibleCount;
    const allSelected = selectedCount === totalCount;

    return { show: shouldShow, allSelected };
  }, [
    selectionEnabled,
    getItemId,
    isSelectable,
    loaded,
    selectableFilteredData,
    filteredSelectedItems.length,
    selectedIds,
    visibleItems,
  ]);

  const handleSelectAllMatching = useCallback(() => {
    onSelectAll(true, selectableFilteredData);
  }, [onSelectAll, selectableFilteredData]);

  const dataViewFilterNodes = useMemo<React.ReactNode[]>(() => {
    const basicFilters: ReactNode[] = [];

    if (!hideNameLabelFilters) {
      basicFilters.push(
        <DataViewTextFilter
          key="name"
          filterId="name"
          title={t('Name')}
          placeholder={t('Filter by name')}
        />,
      );
    }

    if (!hideNameLabelFilters && !hideLabelFilter && loaded) {
      basicFilters.push(
        <DataViewLabelFilter key="label" filterId="label" title={t('Label')} data={data} />,
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
      EmptyMsg={EmptyMsg}
    >
      <DataView
        activeState={activeState}
        className={css(dataViewFilterNodes.length === 1 && 'co-console-data-view-single-filter')}
        data-test={`console-data-view-${resolvedID}`}
      >
        <DataViewToolbar
          filters={
            dataViewFilterNodes.length > 0 && (
              <DataViewFilters
                data-test="data-view-filters"
                values={filters}
                onChange={(_e, values) => onSetFilters(values)}
              >
                {dataViewFilterNodes}
              </DataViewFilters>
            )
          }
          clearAllFilters={clearAllFilters}
          actions={
            <>
              <ResponsiveActions breakpoint="md">
                {preparedTable.columnLayout && (
                  <ResponsiveAction
                    isPersistent
                    variant="plain"
                    onClick={() =>
                      launchModal(LazyColumnManagementModalOverlay, {
                        columnLayout: preparedTable.columnLayout,
                        noLimit: true,
                      })
                    }
                    aria-label={t('Column management')}
                    data-test="manage-columns"
                  >
                    <Tooltip content={t('Manage columns')} trigger="mouseenter">
                      <RhUiColumnsIcon />
                    </Tooltip>
                  </ResponsiveAction>
                )}
                {canResetColumnWidths && (
                  <ResponsiveAction
                    isPersistent
                    variant="plain"
                    onClick={handleResetColumnWidths}
                    aria-label={t('Reset column widths')}
                    data-test="reset-column-widths"
                  >
                    <Tooltip content={t('Reset column widths')} trigger="mouseenter">
                      <RhUiUndoIcon />
                    </Tooltip>
                  </ResponsiveAction>
                )}
                {additionalActions}
              </ResponsiveActions>
              {customActions}
              {selection && (
                <ResourceBulkActionMenu
                  reference={bulkActionReference}
                  resources={selectedResources?.resources ?? []}
                  getResourceId={getResourceId}
                  clearSelection={clearSelection}
                  deselect={deselect}
                  localActions={bulkActions}
                  selectedCount={filteredSelectedItems.length}
                  selectionKey={selectionKey}
                />
              )}
            </>
          }
          pagination={
            <Pagination
              itemCount={filteredData.length}
              titles={paginationTitles}
              variant={PaginationVariant.top}
              isCompact
              {...pagination}
            />
          }
        />
        {bannerState.show && (
          <Banner
            className="pf-v6-u-mb-md"
            screenReaderText={
              bannerState.allSelected
                ? t('You selected all {{numberOf}} {{label}}.', {
                    numberOf: selectableFilteredData.length,
                    label: label || t('items'),
                  })
                : t('You selected all {{label}} on this page.', {
                    label: label || t('items'),
                  })
            }
          >
            {bannerState.allSelected ? (
              <>
                {t('You selected all {{numberOf}} {{label}}.', {
                  numberOf: selectableFilteredData.length,
                  label: label || t('items'),
                })}{' '}
                <Button variant="link" isInline onClick={clearSelection}>
                  {t('Clear all.')}
                </Button>
              </>
            ) : (
              <>
                {t('You selected all {{label}} on this page.', { label: label || t('items') })}{' '}
                <Button variant="link" isInline onClick={handleSelectAllMatching}>
                  {t('Select all {{numberOf}} {{label}}.', {
                    numberOf: selectableFilteredData.length,
                    label: label || t('items'),
                  })}
                </Button>
              </>
            )}
          </Banner>
        )}
        <InnerScrollContainer>
          <DataViewTable
            key={tableKey}
            aria-label={t(`public~{{label}} table`, { label })}
            columns={dataViewColumns}
            rows={dataViewRows}
            bodyStates={{ empty: bodyEmpty, loading: bodyLoading }}
            gridBreakPoint=""
            variant="compact"
            data-test="data-view-table"
            isResizable={isResizable}
          />
        </InnerScrollContainer>
        <Pagination
          itemCount={filteredData.length}
          titles={paginationTitles}
          variant={PaginationVariant.bottom}
          isCompact
          {...pagination}
        />
      </DataView>
    </StatusBox>
  );
};

/**
 * Returns the style prop for a Labels column so it can be shared across tables.
 * @param width - (optional) Width in pixels; defaults to `defaultWidth`.
 * @param defaultWidth - Default width when no width is provided (default 200)
 * @returns Style object for the column's props.style
 */
export const getLabelsColumnWidthStyleProp = (width?: number, defaultWidth = 200) => ({
  style: {
    width: `${width ?? defaultWidth}px`,
  },
});
