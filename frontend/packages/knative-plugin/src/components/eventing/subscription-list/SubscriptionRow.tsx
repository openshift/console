import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { EventSubscriptionKind } from '../../../types';
import { SubscriptionConditionTypes } from '../../../types';
import { getConditionString, getCondition } from '../../../utils/condition-utils';

export const getSubscriptionDataViewRows: GetDataViewRows<EventSubscriptionKind> = (
  data,
  columns,
) =>
  data.map(({ obj }) => {
    const {
      metadata: { name, namespace, creationTimestamp, uid },
      spec: { channel: connectedChannel, subscriber },
    } = obj;
    const objReference = referenceFor(obj);
    const readyCondition = obj.status
      ? getCondition(obj.status.conditions, SubscriptionConditionTypes.Ready)
      : null;
    const rowCells = {
      name: {
        cell: <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />,
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={namespace} /> },
      ready: { cell: (readyCondition && readyCondition.status) || '-' },
      condition: { cell: obj.status ? getConditionString(obj.status.conditions) : '-' },
      channel: {
        cell: (
          <ResourceLink
            kind={referenceFor(connectedChannel)}
            name={connectedChannel.name}
            namespace={namespace}
          />
        ),
      },
      subscriber: {
        cell: subscriber?.ref ? (
          <ResourceLink
            kind={referenceFor(subscriber.ref)}
            name={subscriber.ref.name}
            namespace={namespace}
          />
        ) : (
          '-'
        ),
      },
      created: { cell: <Timestamp timestamp={creationTimestamp} /> },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });
