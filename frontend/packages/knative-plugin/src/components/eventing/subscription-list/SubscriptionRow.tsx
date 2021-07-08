import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { EventingSubscriptionModel } from '../../../models';
import { EventSubscriptionKind, SubscriptionConditionTypes } from '../../../types';
import { getConditionString, getCondition } from '../../../utils/condition-utils';
import { tableColumnClasses } from './subscription-table';

type SubscriptionRowType = {
  channel?: string;
};
const SubscriptionRow: RowFunction<EventSubscriptionKind, SubscriptionRowType> = ({
  obj,
  index,
  key,
  style,
  customData,
}) => {
  const {
    metadata: { name, namespace, creationTimestamp, uid },
    spec: { channel: connectedChannel, subscriber },
  } = obj;

  const objReference = referenceFor(obj);

  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(EventingSubscriptionModel),
    ...Kebab.factory.common,
  ];
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, SubscriptionConditionTypes.Ready)
    : null;
  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
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
        <ResourceKebab actions={menuActions} kind={objReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default SubscriptionRow;
