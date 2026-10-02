import { Fragment } from 'react';
import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ExternalLinkWithCopy } from '@console/internal/components/utils/link';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s/k8s';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { RevisionModel, RouteModel } from '../../models';
import type { RouteKind } from '../../types';
import { getConditionString } from '../../utils/condition-utils';

const routeReference = referenceForModel(RouteModel);
const revisionReference = referenceForModel(RevisionModel);

export const getRouteDataViewRows: GetDataViewRows<RouteKind> = (data, columns) =>
  data.map(({ obj }) => {
    const objReference = referenceFor(obj);
    const context = { [objReference]: obj };
    const rowCells = {
      name: {
        cell: (
          <ResourceLink
            kind={routeReference}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ),
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={obj.metadata.namespace} /> },
      url: {
        cell:
          (obj.status && obj.status.url && (
            <ExternalLinkWithCopy href={obj.status.url} text={obj.status.url} displayBlock />
          )) ||
          '-',
      },
      created: { cell: <Timestamp timestamp={obj.metadata.creationTimestamp} /> },
      conditions: { cell: obj.status ? getConditionString(obj.status.conditions) : '-' },
      traffic: {
        cell:
          obj.status && obj.status.traffic
            ? obj.status.traffic.map((t, i) => (
                <Fragment key={t.revisionName}>
                  {i > 0 ? ', ' : ''}
                  {`${t.percent}% → `}
                  <ResourceLink
                    namespace={obj.metadata.namespace}
                    kind={revisionReference}
                    name={t.revisionName}
                    inline
                    hideIcon
                  />
                </Fragment>
              ))
            : '-',
      },
      actions: { cell: <LazyActionMenu context={context} /> },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });
