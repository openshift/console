import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { EventingBrokerModel } from '../../../models';
import type { EventBrokerKind } from '../../../types';
import { useBrokerColumns } from './BrokerHeaders';
import { getBrokerDataViewRows } from './BrokerRow';

type BrokerListProps = Omit<
  ConsoleDataViewProps<EventBrokerKind>,
  'id' | 'columns' | 'getDataViewRows'
>;

export const BrokerList: FC<BrokerListProps> = (props) => {
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
