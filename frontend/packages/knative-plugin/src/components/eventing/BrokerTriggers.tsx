import * as React from 'react';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { Loading, ResourceLink } from '@console/internal/components/utils';
import { EventingTriggerModel } from '../../models';
import { EventBrokerKind, EventTriggerKind } from '../../types';

type BrokerTriggersProps = {
  broker: EventBrokerKind;
};

const BrokerTriggers: React.FC<BrokerTriggersProps> = ({ broker }) => {
  const {
    metadata: { name, namespace },
  } = broker;
  const resource: WatchK8sResource = React.useMemo(
    () => ({
      isList: true,
      kind: referenceForModel(EventingTriggerModel),
      namespace,
    }),
    [namespace],
  );
  const [data, loaded, loadError] = useK8sWatchResource<EventTriggerKind[]>(resource);

  if (!loaded && loadError) {
    return loadError.message;
  }

  if (!loaded) {
    return <Loading />;
  }
  const triggers = data.filter((trigger) => trigger.spec?.broker === name);
  return triggers.length > 0
    ? triggers.map((trigger: EventTriggerKind) => (
        <ResourceLink
          key={trigger.metadata.uid}
          kind={referenceForModel(EventingTriggerModel)}
          name={trigger.metadata.name}
          namespace={trigger.metadata.namespace}
          title={trigger.metadata.uid}
        />
      ))
    : '-';
};

export default BrokerTriggers;
