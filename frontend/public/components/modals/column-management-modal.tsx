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

export const MAX_VIEW_COLS = 9;

export const NAME_COLUMN_ID = 'NAME';
const READ_ONLY_COLS = [NAME_COLUMN_ID];

const DataListRow: React.FC<DataListRowProps> = ({ column, onChange, disableUncheckedRow }) => (
  <DataListItem aria-labelledby={`table-column-management-item-${column.ID}`} key={column.ID}>
    <DataListItemRow>
      <DataListCheck
        isDisabled={(disableUncheckedRow && !column.visible) || READ_ONLY_COLS.includes(column.ID)}
        aria-labelledby={`table-column-management-item-${column.ID}`}
        checked={column.visible}
        name={column.title}
        id={column.ID}
        onChange={onChange}
      />
      <DataListItemCells
        dataListCells={[
          <DataListCell id={`table-column-management-item-${column.ID}`} key={column.ID}>
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
  columnManagementID,
  columnManagementType,
  selectedColumns,
}) => {
  const dispatch = useDispatch();
  const initialDefaultColumns = !_.isEmpty(selectedColumns)
    ? selectedColumns.filter((column) => column.title.length > 0 && !column.additional)
    : {};
  const initialAdditionalColumns = !_.isEmpty(selectedColumns)
    ? selectedColumns.filter((column) => column.additional)
    : {};
  const [defaultColumns, setDefaultColumns] = React.useState<any[]>(initialDefaultColumns);

  const [additionalColumns, setAdditionalColumns] = React.useState<ColumnHeaderRow[]>(
    initialAdditionalColumns,
  );

  const updateColumns = (checked: boolean, id: string, columnArray: any): any => {
    return columnArray.map((column) => {
      if (!id || column.ID === id) {
        return { ...column, visible: checked };
      }
      return column;
    });
  };

  const defaultColumnChange = (checked: boolean, event: React.SyntheticEvent): void => {
    setDefaultColumns(updateColumns(checked, event?.currentTarget?.id, defaultColumns));
  };

  const additionalColumnChange = (checked: boolean, event: React.SyntheticEvent): void => {
    setAdditionalColumns(updateColumns(checked, event?.currentTarget?.id, additionalColumns));
  };

  const submit = (event): void => {
    event.preventDefault();
    dispatch(setTableColumns(columnManagementID, [...defaultColumns, ...additionalColumns]));
    close();
  };

  const areMaxColumnsDisplayed =
    additionalColumns.filter((column) => column.visible).length +
      defaultColumns.filter((column) => column.visible).length >=
    MAX_VIEW_COLS;

  const resetColumns = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    setDefaultColumns(updateColumns(true, null, defaultColumns));
    setAdditionalColumns(updateColumns(false, null, additionalColumns));
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">Manage Columns</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>Checked categories will be displayed in the table.</p>
        </div>
        <div className="row co-m-form-row">
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
                    key={defaultColumn.ID}
                    onChange={defaultColumnChange}
                    disableUncheckedRow={areMaxColumnsDisplayed}
                    column={defaultColumn}
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
                    key={additionalColumn.ID}
                    onChange={additionalColumnChange}
                    disableUncheckedRow={areMaxColumnsDisplayed}
                    column={additionalColumn}
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
  column: any;
  onChange: (checked: boolean, event: React.SyntheticEvent) => void;
  disableUncheckedRow: boolean;
};

export type ColumnManagementModalProps = {
  cancel?: () => void;
  close?: () => void;
  columnManagementID: string;
  selectedColumns: any;
  columnManagementType: string;
};

type ColumnHeaderRow = {
  ID: string;
  title: string;
  visible: boolean;
};
