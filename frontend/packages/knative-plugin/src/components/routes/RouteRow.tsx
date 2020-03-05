import * as React from 'react';
import * as cx from 'classnames';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import {
  Kebab,
  ResourceLink,
  ResourceKebab,
  Timestamp,
  ExternalLink,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { RevisionModel, RouteModel } from '../../models';
import { getConditionString } from '../../utils/condition-utils';
import { RouteKind } from '../../types';
import { tableColumnClasses } from './route-table';

const routeReference = referenceForModel(RouteModel);
const revisionReference = referenceForModel(RevisionModel);

const RouteRow: RowFunction<RouteKind> = ({ obj, index, key, style }) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>
      <ResourceLink
        kind={routeReference}
        name={obj.metadata.name}
        namespace={obj.metadata.namespace}
        title={obj.metadata.uid}
      />
    </TableData>
    <TableData className={cx(tableColumnClasses[1], 'co-break-word')}>
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
    </TableData>
    <TableData className={tableColumnClasses[2]}>
      {(obj.status && obj.status.url && (
        <ExternalLink href={obj.status.url} text={obj.status.url} />
      )) ||
        '-'}
    </TableData>
    <TableData className={tableColumnClasses[3]}>
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </TableData>
    <TableData className={tableColumnClasses[4]}>
      {obj.status ? getConditionString(obj.status.conditions) : '-'}
    </TableData>
    <TableData className={tableColumnClasses[5]}>
      {obj.status && obj.status.traffic
        ? obj.status.traffic.map((t, i) => (
            <React.Fragment key={t.revisionName}>
              {i > 0 ? ', ' : ''}
              {`${t.percent}% → `}
              <ResourceLink
                namespace={obj.metadata.namespace}
                kind={revisionReference}
                name={t.revisionName}
                inline
                hideIcon
              />
            </React.Fragment>
          ))
        : '-'}
    </TableData>
    <TableData className={tableColumnClasses[6]}>
      <ResourceKebab actions={[...Kebab.factory.common]} kind={routeReference} resource={obj} />
    </TableData>
  </TableRow>
);

export default RouteRow;
