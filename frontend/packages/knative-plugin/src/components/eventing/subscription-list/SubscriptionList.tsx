import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import getSubscriptionHeaders from './SubscriptionHeaders';
import SubscriptionRow from './SubscriptionRow';

const SubscriptionList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  const subscriptionData = props.customData?.channel
    ? props.data.filter((obj) => obj.spec.channel.name === props.customData.channel)
    : props.data;

  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Subscriptions')}
      data={subscriptionData}
      Header={getSubscriptionHeaders(t, !props.customData?.channel)}
      Row={SubscriptionRow}
      virtualize
    />
  );
};

export default SubscriptionList;
