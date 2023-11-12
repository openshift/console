import * as React from 'react';
import * as cx from 'classnames';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ResourceLink, Timestamp, ExternalLink } from '@console/internal/components/utils';
import { referenceForModel, referenceFor } from '@console/internal/module/k8s';
import { LazyActionMenu, ClampedText } from '@console/shared';
import { ServiceModel } from '../../models';
import { ServiceKind, ConditionTypes } from '../../types';
import { getCondition } from '../../utils/condition-utils';
import GetConditionsForStatus from '../functions/GetConditionsForStatus';
import { tableColumnClasses } from './service-table';

const serviceReference = referenceForModel(ServiceModel);

const ServiceRow: React.FC<RowFunctionArgs<ServiceKind>> = ({ obj }) => {
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, ConditionTypes.Ready)
    : null;
  const objReference = referenceFor(obj);
  const context = { [objReference]: obj };

  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={serviceReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
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
      <TableData className={tableColumnClasses[3]}>
        {obj.status ? <GetConditionsForStatus conditions={obj.status.conditions} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {(readyCondition && readyCondition.status) || '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {(readyCondition?.message && (
          <ClampedText lineClamp={5}>{readyCondition?.message}</ClampedText>
        )) ||
          '-'}
      </TableData>
      <TableData className={tableColumnClasses[6]}>{obj.metadata.generation || '-'}</TableData>
      <TableData className={tableColumnClasses[7]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export default ServiceRow;
