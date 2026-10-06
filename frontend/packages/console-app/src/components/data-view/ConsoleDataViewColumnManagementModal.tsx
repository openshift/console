import type { FC, MouseEvent } from 'react';
import { useMemo, useRef } from 'react';
import PatternFlyColumnManagementModal from '@patternfly/react-component-groups/dist/dynamic/ColumnManagementModal';
import type { ColumnManagementModalColumn } from '@patternfly/react-component-groups/dist/dynamic/ColumnManagementModal';
import { useTranslation } from 'react-i18next';
import type { ColumnLayout } from '@console/dynamic-plugin-sdk';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { COLUMN_MANAGEMENT_USER_PREFERENCE_KEY } from '@console/shared/src/constants/common';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import type { ModalComponentProps } from '@console/shared/src/types/modal';

const MAX_VIEW_COLS = 9;
const NAME_COLUMN_ID = 'name';

export const ConsoleDataViewColumnManagementModal: FC<
  ConsoleDataViewColumnManagementModalProps
> = ({ cancel, close, columnLayout, noLimit }) => {
  const [, setTableColumns, preferenceLoaded] = useUserPreference<object>(
    COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
    undefined,
    true,
  );
  const { t } = useTranslation('public');
  const saveAttempted = useRef(false);
  const saveRejected = useRef(false);

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
      columnLayout.selectedColumns?.size ? new Set(columnLayout.selectedColumns) : defaultColumnIDs,
    [columnLayout.selectedColumns, defaultColumnIDs],
  );
  const appliedColumns = useMemo<ColumnManagementModalColumn[]>(
    () =>
      columnLayout.columns
        .filter(({ id }) => id)
        .map(({ id, title, additional }) => ({
          key: id,
          title,
          isShownByDefault: !additional,
          isShown: selectedColumnIDs.has(id),
          isUntoggleable: id === NAME_COLUMN_ID,
        })),
    [columnLayout.columns, selectedColumnIDs],
  );

  if (!preferenceLoaded) {
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

    const orderedShownIDs = columnLayout.columns
      .filter(({ id }) => shownIDs.has(id))
      .map(({ id }) => id);
    setTableColumns((prevState) => ({
      ...prevState,
      [columnLayout.id]: orderedShownIDs,
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

ConsoleDataViewColumnManagementModal.displayName = 'ConsoleDataViewColumnManagementModal';

type ConsoleDataViewColumnManagementModalProps = {
  columnLayout: ColumnLayout;
  noLimit?: boolean;
} & ModalComponentProps;
