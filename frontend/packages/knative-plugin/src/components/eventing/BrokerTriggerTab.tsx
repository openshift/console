import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingTriggerModel } from '../../models';
import { EventBrokerKind } from '../../types';
import TriggerList from './triggers-list/TriggerList';

type BrokerTriggerTabProps = {
  obj: EventBrokerKind;
};

const BrokerTriggerTab: React.FC<BrokerTriggerTabProps> = ({ obj }) => (
  <ListPage
    canCreate={false}
    showTitle={false}
    kind={referenceForModel(EventingTriggerModel)}
    ListComponent={TriggerList}
    namespace={obj.metadata.namespace}
    customData={{
      broker: obj.metadata.name,
    }}
  />
);

export default BrokerTriggerTab;
