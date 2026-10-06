import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { EventingSubscriptionModel } from '../../../models';
import type { EventSubscriptionKind } from '../../../types';
import { useSubscriptionColumns } from './SubscriptionHeaders';
import { getSubscriptionDataViewRows } from './SubscriptionRow';

type SubscriptionListProps = Omit<
  ConsoleDataViewProps<EventSubscriptionKind>,
  'id' | 'columns' | 'getDataViewRows'
> & { customData?: { channel?: string } };

export const SubscriptionList: FC<SubscriptionListProps> = (props) => {
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
