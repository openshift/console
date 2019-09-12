import * as React from 'react';
import * as cx from 'classnames';
import { TableRow, TableData } from '@console/internal/components/factory';
import {
  Kebab,
  ResourceLink,
  ResourceKebab,
  Timestamp,
  ExternalLink,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  RevisionModelAlpha,
  RevisionModelBeta,
  RouteModelAlpha,
  RouteModelBeta,
} from '../../models';
import { getConditionString } from '../../utils/condition-utils';
import { RouteKind, ConfigurationKind } from '../../types';
import { tableColumnClasses } from './route-table';

const routeReferenceAlpha = referenceForModel(RouteModelAlpha);
const routeReferenceBeta = referenceForModel(RouteModelBeta);
const revisionReferenceAlpha = referenceForModel(RevisionModelAlpha);
const revisionReferenceBeta = referenceForModel(RevisionModelBeta);

export interface RouteRowProps {
  obj: RouteKind;
  index: number;
  key?: string;
  style: object;
  customData: {
    configurationsByName: {
      [key: string]: ConfigurationKind;
    };
  };
}

export const RouteRowAlpha: React.FC<RouteRowProps> = ({ obj, index, key, style }) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>
      <ResourceLink
        kind={routeReferenceAlpha}
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
                kind={revisionReferenceAlpha}
                name={t.revisionName}
                inline
                hideIcon
              />
            </React.Fragment>
          ))
        : '-'}
    </TableData>
    <TableData className={tableColumnClasses[6]}>
      <ResourceKebab actions={Kebab.factory.common} kind={routeReferenceAlpha} resource={obj} />
    </TableData>
  </TableRow>
);

export const RouteRowBeta: React.FC<RouteRowProps> = ({ obj, index, key, style }) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>
      <ResourceLink
        kind={routeReferenceBeta}
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
                kind={revisionReferenceBeta}
                name={t.revisionName}
                inline
                hideIcon
              />
            </React.Fragment>
          ))
        : '-'}
    </TableData>
    <TableData className={tableColumnClasses[6]}>
      <ResourceKebab actions={Kebab.factory.common} kind={routeReferenceBeta} resource={obj} />
    </TableData>
  </TableRow>
);
