import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { TableData, TableRow } from '@console/internal/components/factory';
import { tableColumnClasses } from './HelmReleaseResourceTableHeader';

export interface HelmResourceTableRowProps {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
}

const HelmReleaseResourceTableRow: React.FC<HelmResourceTableRowProps> = ({
  obj: resource,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={resource.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses.name}>
        <ResourceLink
          kind={resource.kind}
          name={resource.metadata.name}
          namespace={resource.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses.kind}>{resource.kind}</TableData>
      <TableData className={tableColumnClasses.status}>
        <Status status={_.get(resource.status, 'phase', 'Created')} />
      </TableData>
      <TableData className={tableColumnClasses.timestamp}>
        <Timestamp timestamp={resource.metadata.creationTimestamp} />
      </TableData>
    </TableRow>
  );
};

export default HelmReleaseResourceTableRow;
