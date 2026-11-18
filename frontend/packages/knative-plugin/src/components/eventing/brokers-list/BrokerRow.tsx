import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { NamespaceModel } from '@console/internal/models';
import { referenceFor } from '@console/internal/module/k8s/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { EventBrokerKind } from '../../../types';
import { BrokerConditionTypes } from '../../../types';
import { getCondition, getConditionString } from '../../../utils/condition-utils';

export const getBrokerDataViewRows: GetDataViewRows<EventBrokerKind> = (data, columns) =>
  data.map(({ obj }) => {
    const {
      metadata: { name, namespace, creationTimestamp, uid },
    } = obj;
    const objReference = referenceFor(obj);
    const readyCondition = obj.status
      ? getCondition(obj.status.conditions, BrokerConditionTypes.Ready)
      : null;
    const rowCells = {
      name: {
        cell: <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />,
      },
      namespace: { cell: <ResourceLink kind={NamespaceModel.kind} name={namespace} /> },
      ready: { cell: (readyCondition && readyCondition.status) || '-' },
      condition: { cell: obj.status ? getConditionString(obj.status.conditions) : '-' },
      created: { cell: <Timestamp timestamp={creationTimestamp} /> },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });
