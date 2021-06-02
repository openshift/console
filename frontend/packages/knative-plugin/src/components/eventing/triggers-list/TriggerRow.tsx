import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { EventingTriggerModel, EventingBrokerModel } from '../../../models';
import { EventTriggerKind, TriggerConditionTypes } from '../../../types';
import { getConditionString, getCondition } from '../../../utils/condition-utils';
import { tableColumnClasses } from './trigger-table';

type TriggerRowType = {
  broker?: string;
};
const TriggerRow: RowFunction<EventTriggerKind, TriggerRowType> = ({
  obj,
  index,
  key,
  style,
  customData,
}) => {
  const {
    metadata: { name, namespace, creationTimestamp, uid },
    spec: { subscriber, filter, broker: connectedBroker },
  } = obj;

  const objReference = referenceFor(obj);
  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(EventingTriggerModel),
    ...Kebab.factory.common,
  ];
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, TriggerConditionTypes.Ready)
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
      <TableData columnID="filters" className={tableColumnClasses[4]}>
        {filter.attributes
          ? Object.entries(filter.attributes).map(([fkey, val]) => (
              <div key={fkey}>{`${fkey}:${val}`}</div>
            ))
          : '-'}
      </TableData>
      {!customData?.broker && (
        <TableData columnID="broker" className={tableColumnClasses[5]}>
          <ResourceLink
            kind={referenceForModel(EventingBrokerModel)}
            name={connectedBroker}
            namespace={namespace}
          />
        </TableData>
      )}
      <TableData columnID="subscriber" className={tableColumnClasses[6]}>
        {subscriber.ref ? (
          <ResourceLink kind={referenceFor(subscriber.ref)} name={subscriber.ref.name} />
        ) : (
          '-'
        )}
      </TableData>
      <TableData columnID="created" className={tableColumnClasses[7]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebab actions={menuActions} kind={objReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default TriggerRow;
