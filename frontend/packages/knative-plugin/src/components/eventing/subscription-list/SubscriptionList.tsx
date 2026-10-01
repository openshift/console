import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory/table';
import { EventingSubscriptionModel } from '../../../models';
import type { EventSubscriptionKind } from '../../../types';
import { useSubscriptionColumns } from './SubscriptionHeaders';
import { getSubscriptionDataViewRows } from './SubscriptionRow';

export const SubscriptionList: FC<TableProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const channel = props.customData?.channel;
  const data = useMemo(
    () =>
      channel
        ? props.data?.filter((obj: EventSubscriptionKind) => obj.spec.channel.name === channel)
        : props.data,
    [props.data, channel],
  );
  const { columns } = useSubscriptionColumns(!channel);
  return (
    <ConsoleDataView<EventSubscriptionKind>
      {...props}
      id={EventingSubscriptionModel}
      label={t('Subscriptions')}
      data={data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getSubscriptionDataViewRows}
    />
  );
};
