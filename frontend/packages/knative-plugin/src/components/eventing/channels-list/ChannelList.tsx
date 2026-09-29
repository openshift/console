import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory/table';
import type { EventChannelKind } from '../../../types';
import { useKnativeDataViewFilters } from '../../useKnativeDataViewFilters';
import { useChannelColumns } from './ChannelHeaders';
import { getChannelDataViewRows } from './ChannelRow';

export const ChannelList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns, resetAllColumnWidths } = useChannelColumns();
  const dataViewFilters = useKnativeDataViewFilters<EventChannelKind>(props.rowFilters);
  return (
    <ConsoleDataView<EventChannelKind>
      {...props}
      {...dataViewFilters}
      label={t('Channels')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getChannelDataViewRows}
      hideColumnManagement
      isResizable
      resetAllColumnWidths={resetAllColumnWidths}
    />
  );
};
