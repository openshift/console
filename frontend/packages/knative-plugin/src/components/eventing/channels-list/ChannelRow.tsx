import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { getDynamicChannelModel } from '../../../utils/fetch-dynamic-eventsources-utils';
import { EventChannelKind } from '../../../types';

const ChannelRow: RowFunction<EventChannelKind> = ({ obj, index, key, style }) => {
  const objReference = referenceFor(obj);
  const kind = getDynamicChannelModel(objReference);
  const menuActions = [...Kebab.getExtensionsActionsForKind(kind), ...Kebab.factory.common];
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
      <TableData>{kind.label}</TableData>
      <TableData>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={Kebab.columnClass}>
        <ResourceKebab actions={menuActions} kind={objReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default ChannelRow;
