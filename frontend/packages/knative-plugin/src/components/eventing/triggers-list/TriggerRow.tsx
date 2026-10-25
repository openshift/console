import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s/k8s';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { EventingBrokerModel } from '../../../models';
import type { EventTriggerKind } from '../../../types';
import { TriggerConditionTypes } from '../../../types';
import { getConditionString, getCondition } from '../../../utils/condition-utils';

export const getTriggerDataViewRows: GetDataViewRows<EventTriggerKind> = (data, columns) =>
  data.map(({ obj }) => {
    const {
      metadata: { name, namespace, creationTimestamp, uid },
      spec: { subscriber, filter, broker: connectedBroker },
    } = obj;
    const objReference = referenceFor(obj);
    const readyCondition = obj.status
      ? getCondition(obj.status.conditions, TriggerConditionTypes.Ready)
      : null;
    const rowCells = {
      name: {
        cell: <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />,
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={namespace} /> },
      ready: { cell: (readyCondition && readyCondition.status) || '-' },
      condition: { cell: obj.status ? getConditionString(obj.status.conditions) : '-' },
      filters: {
        cell: filter?.attributes
          ? Object.entries(filter.attributes).map(([fkey, val]) => (
              <div key={fkey}>{`${fkey}:${val}`}</div>
            ))
          : '-',
      },
      broker: {
        cell: (
          <ResourceLink
            kind={referenceForModel(EventingBrokerModel)}
            name={connectedBroker}
            namespace={namespace}
          />
        ),
      },
      subscriber: {
        cell: subscriber?.ref ? (
          <ResourceLink kind={referenceFor(subscriber.ref)} name={subscriber.ref.name} />
        ) : (
          '-'
        ),
      },
      created: { cell: <Timestamp timestamp={creationTimestamp} /> },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });
