import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import * as _ from 'lodash';
import {
  Alert,
  DataList,
  DataListCheck,
  DataListItem,
  DataListItemRow,
  DataListCell,
  DataListItemCells,
} from '@patternfly/react-core';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory';
import { setTableColumns } from '../../actions/ui';
import { ITransform } from '@patternfly/react-table';

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
  columnManagementId,
  columnManagementType,
  selectedColumns,
}) => {
  const dispatch = useDispatch();
  const initialSelected = new Set<string>(
    selectedColumns.filter((column) => column.visible && column.id).map((column) => column.id),
  );
  const defaultColumns = !_.isEmpty(selectedColumns)
    ? selectedColumns.filter((column) => column.id && !column.additional)
    : [];
  const additionalColumns = !_.isEmpty(selectedColumns)
    ? selectedColumns.filter((column) => column.additional)
    : [];

  const [checkedColumns, setCheckedColumns] = React.useState<Set<string>>(new Set(initialSelected));

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
    dispatch(
      setTableColumns(
        columnManagementId,
        selectedColumns.map((column) => {
          return { ...column, visible: checkedColumns.has(column.id) };
        }),
      ),
    );
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
      <ModalTitle className="modal-header">Manage Columns</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>Checked categories will be displayed in the table.</p>
        </div>
        <div className="co-m-form-row">
          <Alert
            className="co-alert"
            isInline
            title={`You can select up to ${MAX_VIEW_COLS} columns`}
            variant="info"
          />
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <span className="col-sm-6">
              <label className="control-label">{`Default ${columnManagementType} Columns`}</label>
              <DataList aria-label="default column list" id="defalt-column-management" isCompact>
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
              <label className="control-label">Additional Columns</label>
              <DataList
                aria-label="Additional column list"
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
        submitText="Save"
        resetText="Restore Default Columns"
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
  columnManagementId: string;
  selectedColumns: ManagedColumn[];
  columnManagementType: string;
};

export type ManagedColumn = {
  id?: string;
  props?: any;
  sortField?: string;
  sortFunc?: any;
  title: string;
  transforms?: ITransform[];
  visible: boolean;
  additional?: boolean;
};
