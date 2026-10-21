import type { FC } from 'react';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { TableData } from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
import { NamespaceModel } from '@console/internal/models';
import { referenceFor } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src';
import { KEBAB_COLUMN_CLASS } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { EventBrokerKind } from '../../../types';
import { BrokerConditionTypes } from '../../../types';
import { getCondition, getConditionString } from '../../../utils/condition-utils';

const BrokerRow: FC<RowFunctionArgs<EventBrokerKind>> = ({ obj }) => {
  const {
    metadata: { name, namespace, creationTimestamp, uid },
  } = obj;
  const objReference = referenceFor(obj);
  const context = { [objReference]: obj };
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, BrokerConditionTypes.Ready)
    : null;
  return (
    <>
      <TableData>
        <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />
      </TableData>
      <TableData className="co-break-word" columnID="namespace">
        <ResourceLink kind={NamespaceModel.kind} name={namespace} />
      </TableData>
      <TableData columnID="ready">{(readyCondition && readyCondition.status) || '-'}</TableData>
      <TableData columnID="condition">
        {obj.status ? getConditionString(obj.status.conditions) : '-'}
      </TableData>
      <TableData>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={KEBAB_COLUMN_CLASS}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export default BrokerRow;
