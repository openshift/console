import * as _ from 'lodash';
import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ClampedText } from '@console/shared/src/components/text/ClampedText';
import { RevisionModel, ServiceModel } from '../../models';
import type { RevisionKind } from '../../types';
import { ConditionTypes } from '../../types';
import { getConditionString, getCondition } from '../../utils/condition-utils';

const revisionReference = referenceForModel(RevisionModel);
const serviceReference = referenceForModel(ServiceModel);

export const getRevisionDataViewRows: GetDataViewRows<RevisionKind> = (data, columns) =>
  data.map(({ obj }) => {
    const readyCondition = obj.status
      ? getCondition(obj.status.conditions, ConditionTypes.Ready)
      : null;
    const service = _.get(obj.metadata, `labels["serving.knative.dev/service"]`);
    const rowCells = {
      name: {
        cell: (
          <ResourceLink
            kind={revisionReference}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ),
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={obj.metadata.namespace} /> },
      service: {
        cell: service && (
          <ResourceLink
            kind={serviceReference}
            name={service}
            namespace={obj.metadata.namespace}
            title={service}
          />
        ),
      },
      created: { cell: <Timestamp timestamp={obj.metadata.creationTimestamp} /> },
      conditions: { cell: obj.status ? getConditionString(obj.status.conditions) : '-' },
      ready: { cell: (readyCondition && readyCondition.status) || '-' },
      reason: {
        cell:
          (readyCondition?.message && (
            <ClampedText lineClamp={5}>{readyCondition?.message}</ClampedText>
          )) ||
          '-',
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });
