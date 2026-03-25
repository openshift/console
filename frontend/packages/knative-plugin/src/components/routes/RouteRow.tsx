import type { FC } from 'react';
import { Fragment } from 'react';
import { css } from '@patternfly/react-styles';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { TableData } from '@console/internal/components/factory';
import { ResourceLink, ExternalLinkWithCopy } from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { RevisionModel, RouteModel } from '../../models';
import type { RouteKind } from '../../types';
import { getConditionString } from '../../utils/condition-utils';
import { tableColumnClasses } from './route-table';

const routeReference = referenceForModel(RouteModel);
const revisionReference = referenceForModel(RevisionModel);

const RouteRow: FC<RowFunctionArgs<RouteKind>> = ({ obj }) => {
  const objReference = referenceFor(obj);
  const context = { [objReference]: obj };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={routeReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {(obj.status && obj.status.url && (
          <ExternalLinkWithCopy href={obj.status.url} text={obj.status.url} displayBlock />
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
          : '-'}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export default RouteRow;
