import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState, useEffect } from 'react';
import './ConsoleDataView.scss';
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
import { Trans, useTranslation } from 'react-i18next';
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

const BodyLoading: FC<{ columns: number }> = ({ columns }) => {
  return <SkeletonTableBody rowsCount={5} columnsCount={columns} />;
};

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
  additionalActions,
  customActions,
  selection,
  actionsBreakpoint = 'md',
}: ConsoleDataViewProps<TData, TCustomRowData, TFilters>) => {
  const { t } = useTranslation('console-app');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the rule cannot statically verify optional chaining on `selection`; listing the full object would cause re-runs on every render
  }, [
    filteredData,
    selection?.selectedItems,
    selection?.getItemId,
    selection?.onFilteredSelectionChange,
  ]);

  const { dataViewColumns, dataViewRows, pagination, visibleItems } = useConsoleDataViewData<
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
    selection,
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
    if (!selection || !loaded || filteredData.length === 0) {
      return { show: false, allSelected: false };
    }

    const allVisibleSelected = visibleItems.every((item) =>
      selection.selectedItems.has(selection.getItemId(item)),
    );

    const visibleCount = visibleItems.length;
    const totalCount = filteredData.length;
    const selectedCount = filteredData.filter((item) =>
      selection.selectedItems.has(selection.getItemId(item)),
    ).length;

    // Show banner if all visible items are selected and there are more items than visible
    const shouldShow = allVisibleSelected && visibleCount > 0 && totalCount > visibleCount;
    const allSelected = selectedCount === totalCount;

    return { show: shouldShow, allSelected };
  }, [selection, loaded, filteredData, visibleItems]);

  const handleSelectAllMatching = useCallback(() => {
    if (selection?.onSelectAll) {
      selection.onSelectAll(true, filteredData);
    }
  }, [selection, filteredData]);

  const handleUnselectAll = useCallback(() => {
    if (selection?.onSelectAll) {
      selection.onSelectAll(false, filteredData);
    }
  }, [selection, filteredData]);

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
    >
      <DataView
        activeState={activeState}
        className={css(dataViewFilterNodes.length === 1 && 'co-console-data-view-single-filter')}
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
              <ResponsiveActions breakpoint={actionsBreakpoint}>
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
                    aria-label={t('Column management')}
                    data-test="manage-columns"
                  >
                    <Tooltip content={t('Manage columns')} trigger="mouseenter">
                      <RhUiColumnsIcon />
                    </Tooltip>
                  </ResponsiveAction>
                )}
                {isResizable && resetAllColumnWidths && (
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
                ? t('You selected all {{count}} {{label}}.', {
                    count: filteredData.length,
                    label: label || t('items'),
                  })
                : t('You selected all {{label}} on this page.', {
                    label: label || t('items'),
                  })
            }
          >
            {bannerState.allSelected ? (
              <>
                <Trans ns="console-app" i18nKey="You selected all <1>{{count}}</1> {{label}}.">
                  You selected all <strong>{{ count: filteredData.length }}</strong>{' '}
                  {{ label: label || t('items') }}.
                </Trans>{' '}
                <Button variant="link" isInline onClick={handleUnselectAll}>
                  {t('Clear all.')}
                </Button>
              </>
            ) : (
              <>
                <Trans ns="console-app" i18nKey="You selected all {{label}} on this page.">
                  You selected all {{ label: label || t('items') }} on this page.
                </Trans>{' '}
                <Button variant="link" isInline onClick={handleSelectAllMatching}>
                  <Trans ns="console-app" i18nKey="Select all <1>{{count}}</1> {{label}}.">
                    Select all <strong>{{ count: filteredData.length }}</strong>{' '}
                    {{ label: label || t('items') }}.
                  </Trans>
                </Button>
              </>
            )}
          </Banner>
        )}
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

const SELECTION_COLUMN_WIDTH = '45px';

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
