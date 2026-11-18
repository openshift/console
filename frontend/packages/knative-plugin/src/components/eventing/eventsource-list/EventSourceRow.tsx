import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { NamespaceModel } from '@console/internal/models';
import { referenceFor } from '@console/internal/module/k8s/k8s';
import { modelFor } from '@console/internal/module/k8s/k8s-models';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { EventSourceKind } from '../../../types';
import { EventSourceConditionTypes } from '../../../types';
import { getCondition, getConditionString } from '../../../utils/condition-utils';
import { getDynamicEventSourceModel } from '../../../utils/fetch-dynamic-eventsources-utils';

export const getEventSourceDataViewRows: GetDataViewRows<EventSourceKind> = (data, columns) =>
  data.map(({ obj }) => {
    const {
      metadata: { name, namespace, creationTimestamp, uid },
    } = obj;
    const objReference = referenceFor(obj);
    const kind = getDynamicEventSourceModel(objReference) || modelFor(objReference);
    const readyCondition = obj.status
      ? getCondition(obj.status.conditions, EventSourceConditionTypes.Ready)
      : null;
    const rowCells = {
      name: {
        cell: <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />,
      },
      namespace: { cell: <ResourceLink kind={NamespaceModel.kind} name={namespace} /> },
      ready: { cell: (readyCondition && readyCondition.status) || '-' },
      condition: { cell: obj.status ? getConditionString(obj.status.conditions) : '-' },
      type: { cell: kind.label },
      created: { cell: <Timestamp timestamp={creationTimestamp} /> },
      actions: {
        cell: <LazyActionMenu context={{ 'event-source-actions': obj }} />,
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });
