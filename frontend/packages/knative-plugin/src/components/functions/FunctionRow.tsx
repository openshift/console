import * as React from 'react';
import * as cx from 'classnames';
import { Link } from 'react-router-dom';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import {
  ResourceLink,
  Timestamp,
  ExternalLink,
  ResourceIcon,
} from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { LazyActionMenu, ClampedText } from '@console/shared';
import { ServiceModel } from '../../models';
import { ServiceKind, ConditionTypes } from '../../types';
import { getConditionString, getCondition } from '../../utils/condition-utils';
import { tableColumnClasses } from '../services/service-table';

const serviceReference = referenceForModel(ServiceModel);

const FunctionRow: React.FC<RowFunctionArgs<ServiceKind>> = ({ obj }) => {
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, ConditionTypes.Ready)
    : null;
  const objReference = referenceFor(obj);
  const context = { [objReference]: obj };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceIcon kind={serviceReference} />
        <Link
          to={`/functions/ns/${obj.metadata.namespace}/${obj.metadata.name}`}
          title={obj.metadata.name}
          className="co-resource-item__resource-name"
        >
          {obj.metadata.name}
        </Link>
      </TableData>
      <TableData className={cx(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={cx(tableColumnClasses[2], 'co-break-word')}>
        {(obj.status && obj.status.url && (
          <ExternalLink
            href={obj.status.url}
            additionalClassName="co-external-link--block"
            text={obj.status.url}
          />
        )) ||
          '-'}
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
        {(readyCondition?.message && (
          <ClampedText lineClamp={5}>{readyCondition?.message}</ClampedText>
        )) ||
          '-'}
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export default FunctionRow;
