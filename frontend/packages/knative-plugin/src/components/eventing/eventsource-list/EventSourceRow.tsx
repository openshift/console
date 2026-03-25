import type { FC } from 'react';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { TableData } from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
import { NamespaceModel } from '@console/internal/models';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import LazyActionMenu, {
  KEBAB_COLUMN_CLASS,
} from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { EventSourceKind } from '../../../types';
import { EventSourceConditionTypes } from '../../../types';
import { getCondition, getConditionString } from '../../../utils/condition-utils';
import { getDynamicEventSourceModel } from '../../../utils/fetch-dynamic-eventsources-utils';

const EventSourceRow: FC<RowFunctionArgs<EventSourceKind>> = ({ obj }) => {
  const {
    metadata: { name, namespace, creationTimestamp, uid },
  } = obj;
  const objReference = referenceFor(obj);
  const kind = getDynamicEventSourceModel(objReference) || modelFor(objReference);
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, EventSourceConditionTypes.Ready)
    : null;
  return (
    <>
      <TableData>
        <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />
      </TableData>
      <TableData className="co-break-word" columnID="namespace">
        <ResourceLink kind={NamespaceModel.kind} name={namespace} />
      </TableData>
      <TableData columnID="ready">{(readyCondition && readyCondition.status) || '-'}</TableData>
      <TableData columnID="condition">
        {obj.status ? getConditionString(obj.status.conditions) : '-'}
      </TableData>
      <TableData>{kind.label}</TableData>
      <TableData>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={KEBAB_COLUMN_CLASS}>
        <LazyActionMenu context={{ 'event-source-actions': obj }} />
      </TableData>
    </>
  );
};

export default EventSourceRow;
