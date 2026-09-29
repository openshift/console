import { Link } from 'react-router';
import {
  actionsCellProps,
  getNameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s/k8s';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { ClampedText } from '@console/shared/src/components/text/ClampedText';
import { ServiceModel } from '../../models';
import type { ServiceKind } from '../../types';
import { ConditionTypes } from '../../types';
import { getCondition } from '../../utils/condition-utils';
import GetConditionsForStatus from './GetConditionsForStatus';

const serviceReference = referenceForModel(ServiceModel);

export const getFunctionDataViewRows: GetDataViewRows<ServiceKind> = (data, columns) =>
  data.map(({ obj }) => {
    const readyCondition = obj.status
      ? getCondition(obj.status.conditions, ConditionTypes.Ready)
      : null;
    const objReference = referenceFor(obj);
    const context = { [objReference]: obj };
    const rowCells = {
      name: {
        cell: (
          <>
            {' '}
            <ResourceIcon kind={serviceReference} />
            <Link
              to={`/functions/ns/${obj.metadata.namespace}/${obj.metadata.name}`}
              title={obj.metadata.name}
              className="co-resource-item__resource-name"
            >
              {obj.metadata.name}
            </Link>{' '}
          </>
        ),
        props: getNameCellProps(obj.metadata.name),
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={obj.metadata.namespace} /> },
      url: {
        cell:
          (obj.status && obj.status.url && (
            <ExternalLink href={obj.status.url} displayBlock>
              {obj.status.url}
            </ExternalLink>
          )) ||
          '-',
      },
      conditions: {
        cell: obj.status ? <GetConditionsForStatus conditions={obj.status.conditions} /> : '-',
      },
      ready: { cell: (readyCondition && readyCondition.status) || '-' },
      reason: {
        cell:
          (readyCondition?.message && (
            <ClampedText lineClamp={5}>{readyCondition?.message}</ClampedText>
          )) ||
          '-',
      },
      revision: { cell: obj.metadata.generation || '-' },
      created: { cell: <Timestamp timestamp={obj.metadata.creationTimestamp} /> },
      actions: { cell: <LazyActionMenu context={context} />, props: actionsCellProps },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });
