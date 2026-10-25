import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { RowFilter } from '@console/internal/components/filter-toolbar';
import type { EventSourceKind } from '../../../types';
import { useKnativeDataViewFilters } from '../../useKnativeDataViewFilters';
import { useEventSourceColumns } from './EventSourceHeaders';
import { getEventSourceDataViewRows } from './EventSourceRow';

type EventSourceListProps = Omit<
  ConsoleDataViewProps<EventSourceKind>,
  'id' | 'columns' | 'getDataViewRows'
> & { rowFilters?: RowFilter[] };

export const EventSourceList: FC<EventSourceListProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns } = useEventSourceColumns();
  const dataViewFilters = useKnativeDataViewFilters<EventSourceKind>(props.rowFilters);
  return (
    <ConsoleDataView<EventSourceKind>
      {...props}
      {...dataViewFilters}
      id="console.ui~v1~KnativeEventSourcesCombinedList"
      label={t('Event Sources')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getEventSourceDataViewRows}
    />
  );
};
