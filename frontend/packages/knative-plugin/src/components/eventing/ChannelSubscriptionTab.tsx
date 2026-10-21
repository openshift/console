import type { FC } from 'react';
import { useMemo } from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingSubscriptionModel } from '../../models';
import type { EventChannelKind } from '../../types';
import SubscriptionList from './subscription-list/SubscriptionList';

type ChannelSubscriptionTabProps = {
  obj: EventChannelKind;
};

const ChannelSubscriptionTab: FC<ChannelSubscriptionTabProps> = ({ obj }) => {
  const customData = useMemo(
    () => ({
      channel: obj.metadata.name,
    }),
    [obj.metadata.name],
  );
  return (
    <ListPage
      canCreate={false}
      showTitle={false}
      kind={referenceForModel(EventingSubscriptionModel)}
      ListComponent={SubscriptionList}
      namespace={obj.metadata.namespace}
      customData={customData}
    />
  );
};

export default ChannelSubscriptionTab;
