import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { RowFilter } from '@console/internal/components/filter-toolbar';
import type { EventChannelKind } from '../../../types';
import { useKnativeDataViewFilters } from '../../useKnativeDataViewFilters';
import { useChannelColumns } from './ChannelHeaders';
import { getChannelDataViewRows } from './ChannelRow';

type ChannelListProps = Omit<
  ConsoleDataViewProps<EventChannelKind>,
  'id' | 'columns' | 'getDataViewRows'
> & { rowFilters?: RowFilter[] };

export const ChannelList: FC<ChannelListProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns } = useChannelColumns();
  const dataViewFilters = useKnativeDataViewFilters<EventChannelKind>(props.rowFilters);
  return (
    <ConsoleDataView<EventChannelKind>
      {...props}
      {...dataViewFilters}
      id="console.ui~v1~KnativeChannelsCombinedList"
      label={t('Channels')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getChannelDataViewRows}
    />
  );
};
