import type { FC, SyntheticEvent } from 'react';
import { useState } from 'react';
import {
  Alert,
  Button,
  DataList,
  DataListCheck,
  DataListItem,
  DataListItemRow,
  DataListCell,
  DataListItemCells,
  Form,
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ColumnLayout, ManagedColumn } from '@console/dynamic-plugin-sdk';

import { COLUMN_MANAGEMENT_USER_PREFERENCE_KEY } from '@console/shared/src/constants/common';
import {
  WithUserPreferenceProps,
  withUserPreference,
} from '@console/shared/src/hoc/withUserPreference';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import type { ModalComponentProps } from '../factory';

export const MAX_VIEW_COLS = 9;

export const NAME_COLUMN_ID = 'name';
const readOnlyColumns = new Set([NAME_COLUMN_ID]);

const DataListRow: FC<DataListRowProps> = ({
  checkedColumns,
  column,
  onChange,
  disableUncheckedRow,
}) => (
  <DataListItem
    aria-labelledby={`table-column-management-item-${column.id}`}
    key={column.id}
    className="pf-v6-c-data-list__item--transparent-bg"
  >
    <DataListItemRow>
      <DataListCheck
        className="co-datalist-control"
        isDisabled={
          (disableUncheckedRow && !checkedColumns.has(column.id)) || readOnlyColumns.has(column.id)
        }
        aria-labelledby={`table-column-management-item-${column.id}`}
        isChecked={checkedColumns.has(column.id)}
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

const NamespaceColumnHelpText: FC = () => {
  const { t } = useTranslation();
  return <>{t('public~The namespace column is only shown when in "All projects"')}</>;
};

export const ColumnManagementModal: FC<
  ColumnManagementModalProps & WithUserPreferenceProps<object>
> = ({ cancel, close, columnLayout, setUserSettingState: setTableColumns, noLimit }) => {
  const { t } = useTranslation();
  const defaultColumns = columnLayout.columns.filter((column) => column.id && !column.additional);
  const additionalColumns = columnLayout.columns.filter((column) => column.additional);

  const [checkedColumns, setCheckedColumns] = useState(
    columnLayout.selectedColumns && columnLayout.selectedColumns.size !== 0
      ? new Set(columnLayout.selectedColumns)
      : new Set(defaultColumns.map((col) => col.id)),
  );

  const onColumnChange = (event: SyntheticEvent): void => {
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

  const resetColumns = (event: SyntheticEvent): void => {
    event.preventDefault();
    const updatedCheckedColumns = new Set(checkedColumns);
    defaultColumns.forEach((col) => col.id && updatedCheckedColumns.add(col.id));
    additionalColumns.forEach((col) => updatedCheckedColumns.delete(col.id));
    setCheckedColumns(updatedCheckedColumns);
  };

  return (
    <>
      <ModalHeader
        title={t('public~Manage columns')}
        data-test-id="modal-title"
        labelId="column-management-modal-title"
      />
      <ModalBody>
        <Form id="column-management-form" onSubmit={submit}>
          {!noLimit ? (
            <>
              <p>{t('public~Selected columns will appear in the table.')}</p>
              <Alert
                isInline
                title={t('public~You can select up to {{MAX_VIEW_COLS}} columns', {
                  MAX_VIEW_COLS,
                })}
                variant="info"
              >
                {columnLayout?.showNamespaceOverride && <NamespaceColumnHelpText />}
              </Alert>
            </>
          ) : (
            columnLayout?.showNamespaceOverride && <NamespaceColumnHelpText />
          )}
          <Grid hasGutter>
            <GridItem sm={6}>
              <label>
                {t('public~Default {{resourceKind}} columns', { resourceKind: columnLayout.type })}
              </label>
              <DataList
                aria-label={t('public~Default column list')}
                id="default-column-management"
                isCompact
              >
                {defaultColumns.map((defaultColumn) => (
                  <DataListRow
                    key={defaultColumn.id}
                    onChange={onColumnChange}
                    disableUncheckedRow={!noLimit && areMaxColumnsDisplayed}
                    column={defaultColumn}
                    checkedColumns={checkedColumns}
                  />
                ))}
              </DataList>
            </GridItem>
            <GridItem sm={6}>
              <label>{t('public~Additional columns')}</label>
              <DataList
                aria-label={t('public~Additional column list')}
                id="additional-column-management"
                isCompact
              >
                {additionalColumns.map((additionalColumn) => (
                  <DataListRow
                    key={additionalColumn.id}
                    onChange={onColumnChange}
                    disableUncheckedRow={!noLimit && areMaxColumnsDisplayed}
                    column={additionalColumn}
                    checkedColumns={checkedColumns}
                  />
                ))}
              </DataList>
            </GridItem>
          </Grid>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts>
        <Button
          type="submit"
          variant="primary"
          form="column-management-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
        <Button variant="link" onClick={resetColumns} type="button">
          {t('public~Restore default columns')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

const ColumnManagementModalWithSettings = withUserPreference<
  ColumnManagementModalProps & WithUserPreferenceProps<object>,
  object
>(
  COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
  undefined,
  true,
)(ColumnManagementModal);

export const ColumnManagementModalOverlay: OverlayComponent<ColumnManagementModalProps> = (
  props,
) => (
  <Modal
    isOpen
    onClose={props.closeOverlay}
    variant={ModalVariant.small}
    aria-labelledby="column-management-modal-title"
  >
    <ColumnManagementModalWithSettings
      {...props}
      cancel={props.closeOverlay}
      close={props.closeOverlay}
    />
  </Modal>
);

ColumnManagementModal.displayName = 'ColumnManagementModal';

type DataListRowProps = {
  column: ManagedColumn;
  onChange: (event: SyntheticEvent, checked: boolean) => void;
  disableUncheckedRow: boolean;
  checkedColumns: Set<string>;
};

type ColumnManagementModalProps = {
  columnLayout: ColumnLayout;
  noLimit?: boolean;
} & ModalComponentProps;
