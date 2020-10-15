import * as React from 'react';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { Loading, ResourceLink } from '@console/internal/components/utils';
import { EventingSubscriptionModel } from '../../models';
import { EventChannelKind, EventSubscriptionKind } from '../../types';

type ChannelSubscriptionsProps = {
  channel: EventChannelKind;
};

const ChannelSubscriptions: React.FC<ChannelSubscriptionsProps> = ({ channel }) => {
  const {
    kind,
    metadata: { name, namespace },
  } = channel;
  const resource: WatchK8sResource = React.useMemo(
    () => ({
      isList: true,
      kind: referenceForModel(EventingSubscriptionModel),
      namespace,
    }),
    [namespace],
  );
  const [data, loaded, loadError] = useK8sWatchResource<EventSubscriptionKind[]>(resource);

  if (!loaded && loadError) {
    return loadError.message;
  }

  if (!loaded) {
    return <Loading />;
  }

  const subscriptions = data.filter((sub) => {
    const subChannel = sub.spec?.channel;
    return subChannel && subChannel.name === name && subChannel.kind === kind;
  });

  return subscriptions.length > 0
    ? subscriptions.map((sub: EventSubscriptionKind) => (
        <ResourceLink
          key={sub.metadata.uid}
          kind={referenceForModel(EventingSubscriptionModel)}
          name={sub.metadata.name}
          namespace={sub.metadata.namespace}
          title={sub.metadata.uid}
        />
      ))
    : '-';
};

export default ChannelSubscriptions;
