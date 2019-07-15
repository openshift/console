import * as React from 'react';
import * as cx from 'classnames';
import { TableRow, TableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink, ResourceKebab, Timestamp } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { getConditionString, getCondition } from '../../utils/condition-utils';
import { ServiceKind, ConditionTypes } from '../../types';
import { tableColumnClasses } from './service-table';

const serviceReference = referenceForModel(ServiceModel);

export interface ServiceRowProps {
  obj: ServiceKind;
  index: number;
  key?: string;
  style: object;
}

const ServiceRow: React.FC<ServiceRowProps> = ({ obj, index, key, style }) => {
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, ConditionTypes.Ready)
    : null;
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={serviceReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.uid}
        />
      </TableData>
      <TableData className={cx(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={cx(tableColumnClasses[2], 'co-break-word')}>
        {obj.metadata.domain || '-'}
      </TableData>
      <TableData className={tableColumnClasses[3]}>{obj.metadata.generation || '-'}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {obj.status ? getConditionString(obj.status.conditions) : '-'}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        {(readyCondition && readyCondition.status) || '-'}
      </TableData>
      <TableData className={tableColumnClasses[7]}>
        {(readyCondition && readyCondition.message) || '-'}
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebab actions={Kebab.factory.common} kind={serviceReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default ServiceRow;
