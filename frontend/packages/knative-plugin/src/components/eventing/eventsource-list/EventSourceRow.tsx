import * as React from 'react';
// import * as cx from 'classnames';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { K8sResourceCommon, referenceFor } from '@console/internal/module/k8s';
import { getDynamicEventSourceModel } from '../../../utils/fetch-dynamic-eventsources-utils';

const EventSourceRow: RowFunction<K8sResourceCommon> = ({ obj, index, key, style }) => {
  const objReference = referenceFor(obj);
  const kind = getDynamicEventSourceModel(objReference);
  //   const menuActions = [...Kebab.getExtensionsActionsForKind(kind), ...Kebab.factory.common];

  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData>
        <ResourceLink
          kind={objReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.uid}
        />
      </TableData>
      <TableData className="co-break-word">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData>{kind.label}</TableData>
      <TableData>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData>
        {/* <ResourceKebab actions={menuActions} kind={objReference} resource={obj} /> */}
        Kebab Menu
      </TableData>
    </TableRow>
  );
};

export default EventSourceRow;
