import type { FC, MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import PatternFlyColumnManagementModal from '@patternfly/react-component-groups/dist/dynamic/ColumnManagementModal';
import type { ColumnManagementModalColumn } from '@patternfly/react-component-groups/dist/dynamic/ColumnManagementModal';
import { useTranslation } from 'react-i18next';
import type { ColumnLayout } from '@console/dynamic-plugin-sdk';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import {
  COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY,
  COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
} from '@console/shared/src/constants/common';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import type { ModalComponentProps } from '@console/shared/src/types/modal';

const MAX_VIEW_COLS = 9;
const NAME_COLUMN_ID = 'name';

const ConsoleDataViewColumnManagementModal: FC<ConsoleDataViewColumnManagementModalProps> = ({
  cancel,
  close,
  columnLayout,
  nonReorderableColumnIDs,
  noLimit,
}) => {
  const [tableColumns, setTableColumns, preferenceLoaded] = useUserPreference<
    Record<string, string[]>
  >(COLUMN_MANAGEMENT_USER_PREFERENCE_KEY, undefined, true);
  const [columnOrders, setColumnOrders, orderPreferenceLoaded] = useUserPreference<
    Record<string, string[]>
  >(COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY, undefined, true);
  const { t } = useTranslation('console-app');
  const saveAttempted = useRef(false);
  const saveRejected = useRef(false);
  const nonReorderableIDs = useMemo(
    () => new Set(nonReorderableColumnIDs),
    [nonReorderableColumnIDs],
  );

  const defaultColumnIDs = useMemo(
    () =>
      new Set(
        columnLayout.columns
          .filter((column) => column.id && !column.additional)
          .map(({ id }) => id),
      ),
    [columnLayout.columns],
  );
  const selectedColumnIDs = useMemo(
    () =>
      tableColumns?.[columnLayout.id]?.length
        ? new Set(tableColumns[columnLayout.id])
        : columnLayout.selectedColumns?.size
          ? new Set(columnLayout.selectedColumns)
          : defaultColumnIDs,
    [columnLayout.id, columnLayout.selectedColumns, defaultColumnIDs, tableColumns],
  );
  const columnDefinitions = useMemo<ColumnManagementModalColumn[]>(
    () =>
      columnLayout.columns
        .filter(({ id }) => id)
        .map(({ id, title, additional }) => ({
          key: id,
          title,
          isShownByDefault: !additional,
          isUntoggleable: id === NAME_COLUMN_ID,
        })),
    [columnLayout.columns],
  );
  const columnDefinitionsByID = useMemo(
    () => new Map(columnDefinitions.map((column) => [column.key, column])),
    [columnDefinitions],
  );
  const normalizeColumnOrder = useMemo(
    () =>
      (columns: ColumnManagementModalColumn[]): ColumnManagementModalColumn[] => {
        const columnsByID = new Map(columns.map((column) => [column.key, column]));
        const movableColumns = columns.filter(({ key }) => !nonReorderableIDs.has(key));
        let nextMovableColumn = 0;
        return columnDefinitions.map((column) => {
          const currentColumn = columnsByID.get(column.key) ?? column;
          if (nonReorderableIDs.has(column.key)) {
            return currentColumn;
          }
          return movableColumns[nextMovableColumn++] ?? currentColumn;
        });
      },
    [columnDefinitions, nonReorderableIDs],
  );
  const [pinnedColumns, setPinnedColumns] = useState<ColumnManagementModalColumn[]>();
  const defaultColumns = useMemo(
    () =>
      columnDefinitions.map((column) => ({
        ...column,
        isShown: column.isShownByDefault,
      })),
    [columnDefinitions],
  );
  const orderedColumns = useMemo(() => {
    const availableIDs = new Set(columnDefinitions.map(({ key }) => key));
    const orderedIDs = new Set<string>(
      (columnOrders?.[columnLayout.id] ?? []).filter((id) => availableIDs.has(id)),
    );
    [...selectedColumnIDs, ...columnDefinitions.map(({ key }) => key)].forEach((id) => {
      if (availableIDs.has(id)) {
        orderedIDs.add(id);
      }
    });
    const columnOrder = new Map<string, number>(
      [...orderedIDs].map((id, index) => [id, index] as [string, number]),
    );
    const orderedMovableColumns = columnDefinitions
      .map((column, index) => ({ column, index }))
      .sort(
        (a, b) =>
          (columnOrder.get(a.column.key) ?? a.index) - (columnOrder.get(b.column.key) ?? b.index),
      )
      .map(({ column }) => column)
      .filter(({ key }) => !nonReorderableIDs.has(key));
    let nextMovableColumn = 0;
    return columnDefinitions.map((column) => {
      const orderedColumn = nonReorderableIDs.has(column.key)
        ? column
        : (orderedMovableColumns[nextMovableColumn++] ?? column);
      return { ...orderedColumn, isShown: selectedColumnIDs.has(orderedColumn.key) };
    });
  }, [columnDefinitions, columnLayout.id, columnOrders, nonReorderableIDs, selectedColumnIDs]);
  const [restoreDefaultOrder, setRestoreDefaultOrder] = useState(false);
  const appliedColumns = pinnedColumns ?? (restoreDefaultOrder ? defaultColumns : orderedColumns);

  useEffect(() => {
    if (nonReorderableIDs.size === 0) {
      return;
    }

    const columnListSelector = '[data-ouia-component-id="ColumnManagementModal-column-list"]';
    const disableDragHandles = (): void => {
      const columnList = document.querySelector<HTMLElement>(columnListSelector);
      if (!columnList) {
        return;
      }

      columnList
        .querySelectorAll<HTMLElement>('[data-testid^="column-check-"]')
        .forEach((checkbox) => {
          const columnID = checkbox.dataset.testid?.slice('column-check-'.length);
          if (columnID && nonReorderableIDs.has(columnID)) {
            const dragHandle = checkbox.closest('li')?.querySelector<HTMLButtonElement>('button');
            if (dragHandle) {
              dragHandle.disabled = true;
            }
          }
        });
    };

    const syncStickyColumnPositions = (): void => {
      const columnList = document.querySelector<HTMLElement>(columnListSelector);
      if (!columnList) {
        return;
      }

      const currentColumns = Array.from(
        columnList.querySelectorAll<HTMLInputElement>('[data-testid^="column-check-"]'),
      ).flatMap((checkbox) => {
        const columnID = checkbox.dataset.testid?.slice('column-check-'.length);
        const column = columnID && columnDefinitionsByID.get(columnID);
        return column ? [{ ...column, isShown: checkbox.checked }] : [];
      });
      if (currentColumns.length !== columnDefinitions.length) {
        return;
      }

      const normalizedColumns = normalizeColumnOrder(currentColumns);
      const stickyColumnWasMoved = currentColumns.some(
        (column, index) => column.key !== normalizedColumns[index]?.key,
      );
      const pinnedStateChanged =
        pinnedColumns !== undefined &&
        (normalizedColumns.length !== pinnedColumns.length ||
          normalizedColumns.some(
            (column, index) =>
              column.key !== pinnedColumns[index]?.key ||
              column.isShown !== pinnedColumns[index]?.isShown,
          ));

      if (stickyColumnWasMoved || pinnedStateChanged) {
        setPinnedColumns(normalizedColumns);
      }
    };

    disableDragHandles();
    const observer = new MutationObserver(() => {
      disableDragHandles();
      syncStickyColumnPositions();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [
    columnDefinitions.length,
    columnDefinitionsByID,
    nonReorderableIDs,
    normalizeColumnOrder,
    pinnedColumns,
  ]);

  if (!preferenceLoaded || !orderPreferenceLoaded) {
    return null;
  }

  const description = [
    !noLimit && t('Selected columns will appear in the table.'),
    !noLimit && t('You can select up to {{MAX_VIEW_COLS}} columns', { MAX_VIEW_COLS }),
    !columnLayout.showNamespaceOverride &&
      t('The namespace column is only shown when in "All projects"'),
  ]
    .filter(Boolean)
    .join(' ');

  const applyColumns = (columns: ColumnManagementModalColumn[]): void => {
    saveAttempted.current = true;
    const shownIDs = new Set(columns.filter(({ isShown }) => isShown).map(({ key }) => key));
    const hasNewSelection = [...shownIDs].some((id) => !selectedColumnIDs.has(id));

    if (!noLimit && shownIDs.size > MAX_VIEW_COLS && hasNewSelection) {
      saveRejected.current = true;
      return;
    }

    const movableColumnIDs = columns
      .map(({ key }) => key)
      .filter((id) => !nonReorderableIDs.has(id));
    let nextMovableColumn = 0;
    const orderedIDs: string[] = columnLayout.columns.flatMap(({ id }) => {
      if (nonReorderableIDs.has(id)) {
        return [id];
      }
      const nextColumnID = movableColumnIDs[nextMovableColumn++];
      return nextColumnID ? [nextColumnID] : [];
    });
    const orderedIDSet = new Set(orderedIDs);
    orderedIDs.push(...columns.map(({ key }) => key).filter((id) => !orderedIDSet.has(id)));
    const orderedShownIDs = orderedIDs.filter((id) => shownIDs.has(id));
    setTableColumns((prevState) => ({
      ...prevState,
      [columnLayout.id]: orderedShownIDs,
    }));
    setColumnOrders((prevState) => ({
      ...prevState,
      [columnLayout.id]: orderedIDs,
    }));
  };

  const handleClose = (event: KeyboardEvent | MouseEvent): void => {
    if (saveAttempted.current) {
      saveAttempted.current = false;
      if (saveRejected.current) {
        saveRejected.current = false;
        return;
      }
      close?.();
    } else if ('type' in event) {
      close?.();
    } else {
      cancel?.();
    }
  };

  return (
    <PatternFlyColumnManagementModal
      isOpen
      title={t('Manage columns')}
      description={description}
      appliedColumns={appliedColumns}
      applyColumns={applyColumns}
      onClose={handleClose}
      onReset={() => {
        setPinnedColumns(undefined);
        setRestoreDefaultOrder(true);
      }}
      resetToDefaultLabel={t('Restore default columns')}
      enableDragDrop
      listManagerProps={{
        saveLabel: t('Save'),
        cancelLabel: t('Cancel'),
        bulkSelectProps: {
          selectNoneLabel: t('Select none (0)'),
          selectPageLabel: (pageCount?: number) => t('Select page ({{pageCount}})', { pageCount }),
          selectAllLabel: (totalCount?: number) => t('Select all ({{totalCount}})', { totalCount }),
          selectedLabel: (selectedCount: number) =>
            t('{{selectedCount}} selected', { selectedCount }),
        },
      }}
    />
  );
};

export const ConsoleDataViewColumnManagementModalOverlay: OverlayComponent<
  ConsoleDataViewColumnManagementModalProps
> = (props) => (
  <ConsoleDataViewColumnManagementModal
    {...props}
    cancel={props.closeOverlay}
    close={props.closeOverlay}
  />
);

interface ConsoleDataViewColumnManagementModalProps extends ModalComponentProps {
  columnLayout: ColumnLayout;
  nonReorderableColumnIDs?: string[];
  noLimit?: boolean;
}
