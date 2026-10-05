import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory/table';
import { EventingBrokerModel } from '../../../models';
import type { EventBrokerKind } from '../../../types';
import { useBrokerColumns } from './BrokerHeaders';
import { getBrokerDataViewRows } from './BrokerRow';

export const BrokerList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns } = useBrokerColumns();
  return (
    <ConsoleDataView<EventBrokerKind>
      {...props}
      id={EventingBrokerModel}
      label={t('Brokers')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getBrokerDataViewRows}
    />
  );
};
