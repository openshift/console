import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { K8sResourceCommon, referenceFor } from '@console/internal/module/k8s';
import { getDynamicEventSourceModel } from '../../../utils/fetch-dynamic-eventsources-utils';

const EventSourceRow: RowFunction<K8sResourceCommon> = ({ obj, index, key, style }) => {
  const {
    metadata: { name, namespace, creationTimestamp, uid },
  } = obj;
  const objReference = referenceFor(obj);
  const kind = getDynamicEventSourceModel(objReference);
  const menuActions = [...Kebab.getExtensionsActionsForKind(kind), ...Kebab.factory.common];
  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData>
        <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />
      </TableData>
      <TableData className="co-break-word" columnID="namespace">
        <ResourceLink kind="Namespace" name={namespace} />
      </TableData>
      <TableData>{kind.label}</TableData>
      <TableData>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={Kebab.columnClass}>
        <ResourceKebab actions={menuActions} kind={objReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default EventSourceRow;
