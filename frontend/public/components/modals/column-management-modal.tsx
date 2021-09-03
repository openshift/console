import * as React from 'react';
import {
  Alert,
  DataList,
  DataListCheck,
  DataListItem,
  DataListItemRow,
  DataListCell,
  DataListItemCells,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ColumnLayout, ManagedColumn } from '@console/dynamic-plugin-sdk';

import {
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  WithUserSettingsCompatibilityProps,
  withUserSettingsCompatibility,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
} from '@console/shared';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory';

export const MAX_VIEW_COLS = 9;

export const NAME_COLUMN_ID = 'name';
const readOnlyColumns = new Set([NAME_COLUMN_ID]);

const DataListRow: React.FC<DataListRowProps> = ({
  checkedColumns,
  column,
  onChange,
  disableUncheckedRow,
}) => (
  <DataListItem
    aria-labelledby={`table-column-management-item-${column.id}`}
    key={column.id}
    className="pf-c-data-list__item--transparent-bg"
  >
    <DataListItemRow>
      <DataListCheck
        isDisabled={
          (disableUncheckedRow && !checkedColumns.has(column.id)) || readOnlyColumns.has(column.id)
        }
        aria-labelledby={`table-column-management-item-${column.id}`}
        checked={checkedColumns.has(column.id)}
        name={column.title}
        id={column.id}
        onChange={onChange}
      />
      <DataListItemCells
        dataListCells={[
          <DataListCell id={`table-column-management-item-${column.id}`} key={column.id}>
            <label className="co-label--plain" htmlFor={column.id}>
              {column.title}
            </label>
          </DataListCell>,
        ]}
      />
    </DataListItemRow>
  </DataListItem>
);

export const ColumnManagementModal: React.FC<ColumnManagementModalProps &
  WithUserSettingsCompatibilityProps<object>> = ({
  cancel,
  close,
  columnLayout,
  setUserSettingState: setTableColumns,
}) => {
  const { t } = useTranslation();
  const defaultColumns = columnLayout.columns.filter((column) => column.id && !column.additional);
  const additionalColumns = columnLayout.columns.filter((column) => column.additional);

  const [checkedColumns, setCheckedColumns] = React.useState(
    columnLayout.selectedColumns && columnLayout.selectedColumns.size !== 0
      ? new Set(columnLayout.selectedColumns)
      : new Set(defaultColumns.map((col) => col.id)),
  );

  const onColumnChange = (checked: boolean, event: React.SyntheticEvent): void => {
    const updatedCheckedColumns = new Set<string>(checkedColumns);
    const selectedId = event?.currentTarget?.id;
    updatedCheckedColumns.has(selectedId)
      ? updatedCheckedColumns.delete(selectedId)
      : updatedCheckedColumns.add(selectedId);
    setCheckedColumns(updatedCheckedColumns);
  };

  const submit = (event): void => {
    event.preventDefault();
    const orderedCheckedColumns = new Set<string>();
    columnLayout.columns.forEach(
      (column) => checkedColumns.has(column.id) && orderedCheckedColumns.add(column.id),
    );
    setTableColumns((prevState) => {
      return { ...prevState, [columnLayout.id]: [...orderedCheckedColumns] };
    });
    close();
  };

  const areMaxColumnsDisplayed = checkedColumns.size >= MAX_VIEW_COLS;

  const resetColumns = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    const updatedCheckedColumns = new Set(checkedColumns);
    defaultColumns.forEach((col) => col.id && updatedCheckedColumns.add(col.id));
    additionalColumns.forEach((col) => updatedCheckedColumns.delete(col.id));
    setCheckedColumns(updatedCheckedColumns);
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">{t('public~Manage columns')}</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>{t('public~Selected columns will appear in the table.')}</p>
        </div>
        <div className="co-m-form-row">
          <Alert
            className="co-alert"
            isInline
            title={t('public~You can select up to {{MAX_VIEW_COLS}} columns', { MAX_VIEW_COLS })}
            variant="info"
          >
            {!columnLayout?.showNamespaceOverride &&
              t('public~The namespace column is only shown when in "All projects"')}
          </Alert>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <span className="col-sm-6">
              <label className="control-label">
                {t('public~Default {{resourceKind}} columns', { resourceKind: columnLayout.type })}
              </label>
              <DataList
                aria-label={t('public~Default column list')}
                id="defalt-column-management"
                isCompact
              >
                {defaultColumns.map((defaultColumn) => (
                  <DataListRow
                    key={defaultColumn.id}
                    onChange={onColumnChange}
                    disableUncheckedRow={areMaxColumnsDisplayed}
                    column={defaultColumn}
                    checkedColumns={checkedColumns}
                  />
                ))}
              </DataList>
            </span>
            <span className="col-sm-6">
              <label className="control-label">{t('public~Additional columns')}</label>
              <DataList
                aria-label={t('public~Additional column list')}
                id="additional-column-management"
                isCompact
              >
                {additionalColumns.map((additionalColumn) => (
                  <DataListRow
                    key={additionalColumn.id}
                    onChange={onColumnChange}
                    disableUncheckedRow={areMaxColumnsDisplayed}
                    column={additionalColumn}
                    checkedColumns={checkedColumns}
                  />
                ))}
              </DataList>
            </span>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={false}
        cancel={cancel}
        submitText={t('public~Save')}
        resetText={t('public~Restore default columns')}
        reset={resetColumns}
      />
    </form>
  );
};

export const createColumnManagementModal = createModalLauncher<ColumnManagementModalProps>(
  withUserSettingsCompatibility<
    ColumnManagementModalProps & WithUserSettingsCompatibilityProps<object>,
    object
  >(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  )(ColumnManagementModal),
);

ColumnManagementModal.displayName = 'ColumnManagementModal';

type DataListRowProps = {
  column: ManagedColumn;
  onChange: (checked: boolean, event: React.SyntheticEvent) => void;
  disableUncheckedRow: boolean;
  checkedColumns: Set<string>;
};

export type ColumnManagementModalProps = {
  cancel?: () => void;
  close?: () => void;
  columnLayout: ColumnLayout;
};
