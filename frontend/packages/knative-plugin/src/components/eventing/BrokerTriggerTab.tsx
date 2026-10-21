import type { FC } from 'react';
import { useMemo } from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingTriggerModel } from '../../models';
import type { EventBrokerKind } from '../../types';
import TriggerList from './triggers-list/TriggerList';

type BrokerTriggerTabProps = {
  obj: EventBrokerKind;
};

const BrokerTriggerTab: FC<BrokerTriggerTabProps> = ({ obj }) => {
  const customData = useMemo(
    () => ({
      broker: obj.metadata.name,
    }),
    [obj.metadata.name],
  );
  return (
    <ListPage
      canCreate={false}
      showTitle={false}
      kind={referenceForModel(EventingTriggerModel)}
      ListComponent={TriggerList}
      namespace={obj.metadata.namespace}
      customData={customData}
    />
  );
};

export default BrokerTriggerTab;
