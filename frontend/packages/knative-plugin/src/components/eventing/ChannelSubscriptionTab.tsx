import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingSubscriptionModel } from '../../models';
import { EventChannelKind } from '../../types';
import SubscriptionList from './subscription-list/SubscriptionList';

type ChannelSubscriptionTabProps = {
  obj: EventChannelKind;
};

const ChannelSubscriptionTab: React.FC<ChannelSubscriptionTabProps> = ({ obj }) => {
  const customData = React.useMemo(
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
