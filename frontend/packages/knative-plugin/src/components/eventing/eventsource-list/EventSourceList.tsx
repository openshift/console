import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory/table';
import type { EventSourceKind } from '../../../types';
import { useKnativeDataViewFilters } from '../../useKnativeDataViewFilters';
import { useEventSourceColumns } from './EventSourceHeaders';
import { getEventSourceDataViewRows } from './EventSourceRow';

export const EventSourceList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns, resetAllColumnWidths } = useEventSourceColumns();
  const dataViewFilters = useKnativeDataViewFilters<EventSourceKind>(props.rowFilters);
  return (
    <ConsoleDataView<EventSourceKind>
      {...props}
      {...dataViewFilters}
      label={t('Event Sources')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getEventSourceDataViewRows}
      hideColumnManagement
      isResizable
      resetAllColumnWidths={resetAllColumnWidths}
    />
  );
};
