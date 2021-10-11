import * as React from 'react';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared';
import { EventSubscriptionKind, SubscriptionConditionTypes } from '../../../types';
import { getConditionString, getCondition } from '../../../utils/condition-utils';
import { tableColumnClasses } from './subscription-table';

type SubscriptionRowType = {
  channel?: string;
};
const SubscriptionRow: React.FC<RowFunctionArgs<EventSubscriptionKind, SubscriptionRowType>> = ({
  obj,
  customData,
}) => {
  const {
    metadata: { name, namespace, creationTimestamp, uid },
    spec: { channel: connectedChannel, subscriber },
  } = obj;

  const objReference = referenceFor(obj);
  const context = { [objReference]: obj };
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, SubscriptionConditionTypes.Ready)
    : null;
  return (
    <>
      <TableData columnID="name" className={tableColumnClasses[0]}>
        <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />
      </TableData>
      <TableData columnID="namespace" className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={namespace} />
      </TableData>
      <TableData columnID="ready" className={tableColumnClasses[2]}>
        {(readyCondition && readyCondition.status) || '-'}
      </TableData>
      <TableData columnID="condition" className={tableColumnClasses[3]}>
        {obj.status ? getConditionString(obj.status.conditions) : '-'}
      </TableData>
      {!customData?.channel && (
        <TableData columnID="channel" className={tableColumnClasses[4]}>
          <ResourceLink
            kind={referenceFor(connectedChannel)}
            name={connectedChannel.name}
            namespace={namespace}
          />
        </TableData>
      )}
      <TableData columnID="subscriber" className={tableColumnClasses[5]}>
        {subscriber.ref ? (
          <ResourceLink
            kind={referenceFor(subscriber.ref)}
            name={subscriber.ref.name}
            namespace={namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData columnID="created" className={tableColumnClasses[6]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[7]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export default SubscriptionRow;
