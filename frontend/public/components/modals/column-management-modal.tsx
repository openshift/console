import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
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
import { setColumnManagementFilter } from '../../actions/ui';
import { RootState } from '../../redux';

const MAX_VIEW_COLS = 9;

const OVERRIDES = ['Name'];

const getDataListRows = (
  rowData: any[],
  onChange: (checked: boolean, event: any) => void,
  disableUncheckedRows: boolean,
): React.ReactNode[] =>
  rowData.map((column) => (
    <DataListItem aria-labelledby="table-column-management-item1" key={column.title}>
      <DataListItemRow>
        <DataListCheck
          isDisabled={(disableUncheckedRows && !column.visible) || OVERRIDES.includes(column.title)}
          aria-labelledby="table-column-management-item1"
          checked={column.visible}
          name={column.title}
          onChange={onChange}
        />
        <DataListItemCells
          dataListCells={[
            <DataListCell id={`table-column-management-item-${column.title}`} key={column.title}>
              {column.title}
            </DataListCell>,
          ]}
        />
      </DataListItemRow>
    </DataListItem>
  ));

export const ColumnManagementModal: React.FC<ColumnManagementModalProps> = ({
  kinds,
  cancel,
  close,
}) => {
  const columnFilters = useSelector<RootState, string>(({ UI }) => UI.getIn(['columnManagement']));
  const dispatch = useDispatch();
  const initialDefaultColumns =
    !_.isEmpty(columnFilters) && columnFilters.has(kinds[0])
      ? _.cloneDeep(columnFilters.get(kinds[0])).filter(
          (column) => column.title.length > 0 && !column.additional,
        )
      : {};
  const initialAdditionalColumns =
    !_.isEmpty(columnFilters) && columnFilters.has(kinds[0])
      ? _.cloneDeep(columnFilters.get(kinds[0])).filter((column) => column.additional)
      : {};
  const [defaultColumns, setDefaultColumns] = React.useState<any[]>(initialDefaultColumns);

  const [additionalColumns, setAdditionalColumns] = React.useState<ColumnHeaderRow[]>(
    initialAdditionalColumns,
  );

  const updateColumns = (checked: boolean, name: string, columnArray: any): any => {
    const updatedColumns = _.cloneDeep(columnArray);
    return updatedColumns.map((column) => {
      if (_.isEmpty(name) || column.title === name) {
        column.visible = checked;
        return column;
      }
      return column;
    });
  };

  const defaultColumnChange = (checked: boolean, event): void => {
    const target = event.target;
    setDefaultColumns(updateColumns(checked, target.name, defaultColumns));
  };

  const additionalColumnChange = (checked: boolean, event): void => {
    const target = event.target;
    setAdditionalColumns(updateColumns(checked, target.name, additionalColumns));
  };

  const submit = (event): void => {
    event.preventDefault();
    dispatch(setColumnManagementFilter(kinds[0], [...defaultColumns, ...additionalColumns]));
    close();
  };

  const areMaxColumnsDisplayed =
    additionalColumns.filter((column) => column.visible).length +
      defaultColumns.filter((column) => column.visible).length ===
    MAX_VIEW_COLS;

  const resetColumns = (event): void => {
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
            isInline
            title={`You can select up to ${MAX_VIEW_COLS - 1} columns`}
            variant="info"
          />
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <span className="col-sm-6">
              <label className="control-label">{`Default ${kinds[0]} Columns`}</label>
              <DataList
                aria-label="Table column management"
                id="defalt-column-management"
                isCompact
              >
                {getDataListRows(defaultColumns, defaultColumnChange, areMaxColumnsDisplayed)}
              </DataList>
            </span>
            <span className="col-sm-6">
              <label className="control-label">Additional Columns</label>
              <DataList
                aria-label="Table column management"
                id="additional-column-management"
                isCompact
              >
                {getDataListRows(additionalColumns, additionalColumnChange, areMaxColumnsDisplayed)}
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

export type ColumnManagementModalProps = {
  cancel: () => void;
  close: () => void;
  kinds: any;
};

type ColumnHeaderRow = {
  title: string;
  visible: boolean;
};
