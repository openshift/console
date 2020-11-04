import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
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

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory';
import { setTableColumns } from '../../actions/ui';

export const MAX_VIEW_COLS = 9;

export const NAME_COLUMN_ID = 'name';
const readOnlyColumns = new Set([NAME_COLUMN_ID]);

const DataListRow: React.FC<DataListRowProps> = ({
  checkedColumns,
  column,
  onChange,
  disableUncheckedRow,
}) => (
  <DataListItem aria-labelledby={`table-column-management-item-${column.id}`} key={column.id}>
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
            {column.title}
          </DataListCell>,
        ]}
      />
    </DataListItemRow>
  </DataListItem>
);

export const ColumnManagementModal: React.FC<ColumnManagementModalProps> = ({
  cancel,
  close,
  columnLayout,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const defaultColumns = columnLayout.columns.filter((column) => column.id && !column.additional);
  const additionalColumns = columnLayout.columns.filter((column) => column.additional);

  const [checkedColumns, setCheckedColumns] = React.useState(
    columnLayout.selectedColumns.size !== 0
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
    dispatch(setTableColumns(columnLayout.id, orderedCheckedColumns));
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
      <ModalTitle className="modal-header">{t('modal~Manage columns')}</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>{t('modal~Selected columns will appear in the table.')}</p>
        </div>
        <div className="co-m-form-row">
          <Alert
            className="co-alert"
            isInline
            title={t('modal~You can select up to {{MAX_VIEW_COLS}} columns', { MAX_VIEW_COLS })}
            variant="info"
          >
            {t('modal~The namespace column is only shown when in "All projects"')}
          </Alert>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <span className="col-sm-6">
              <label className="control-label">
                {t('modal~Default {{resourceKind}} columns', { resourceKind: columnLayout.type })}
              </label>
              <DataList
                aria-label={t('modal~Default column list')}
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
              <label className="control-label">{t('modal~Additional columns')}</label>
              <DataList
                aria-label={t('modal~Additional column list')}
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
        resetText={t('modal~Restore default columns')}
        reset={resetColumns}
      />
    </form>
  );
};

export const createColumnManagementModal = createModalLauncher<ColumnManagementModalProps>(
  ColumnManagementModal,
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

export type ColumnLayout = {
  id: string;
  columns: ManagedColumn[];
  selectedColumns: Set<string>;
  type: string;
};

export type ManagedColumn = {
  id?: string;
  title: string;
  additional?: boolean;
};
