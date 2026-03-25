import type { FC } from 'react';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { TableData } from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { ClampedText, LazyActionMenu } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { RevisionModel, ServiceModel } from '../../models';
import type { RevisionKind } from '../../types';
import { ConditionTypes } from '../../types';
import { getConditionString, getCondition } from '../../utils/condition-utils';
import { tableColumnClasses } from './revision-table';

const revisionReference = referenceForModel(RevisionModel);
const serviceReference = referenceForModel(ServiceModel);

const RevisionRow: FC<RowFunctionArgs<RevisionKind>> = ({ obj }) => {
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, ConditionTypes.Ready)
    : null;
  const service = _.get(obj.metadata, `labels["serving.knative.dev/service"]`);
  const objReference = referenceFor(obj);
  const context = { [objReference]: obj };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={revisionReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={css(tableColumnClasses[2], 'co-break-word')}>
        {service && (
          <ResourceLink
            kind={serviceReference}
            name={service}
            namespace={obj.metadata.namespace}
            title={service}
          />
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {obj.status ? getConditionString(obj.status.conditions) : '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {(readyCondition && readyCondition.status) || '-'}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        {(readyCondition?.message && (
          <ClampedText lineClamp={5}>{readyCondition?.message}</ClampedText>
        )) ||
          '-'}
      </TableData>
      <TableData className={tableColumnClasses[7]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export default RevisionRow;
