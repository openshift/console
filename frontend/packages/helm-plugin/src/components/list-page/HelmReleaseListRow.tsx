import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { Timestamp, ResourceIcon } from '@console/internal/components/utils';
import { LazyActionMenu, Status } from '@console/shared';
import { HelmRelease, HelmActionOrigins } from '../../types/helm-types';
import { tableColumnClasses } from './HelmReleaseListHeader';

const HelmReleaseListRow: React.FC<RowFunctionArgs<HelmRelease>> = ({ obj }) => {
  const actionsScope = {
    release: obj,
    actionOrigin: HelmActionOrigins.list,
  };
  return (
    <>
      <TableData className={tableColumnClasses.name}>
        <ResourceIcon kind={'Helm Release'} />
        <Link
          to={`/helm-releases/ns/${obj.namespace}/release/${obj.name}`}
          title={obj.name}
          className="co-resource-item__resource-name"
        >
          {obj.name}
        </Link>
      </TableData>
      <TableData className={tableColumnClasses.revision}>{obj.version}</TableData>
      <TableData className={tableColumnClasses.updated}>
        <Timestamp timestamp={obj.info.last_deployed} />
      </TableData>
      <TableData className={tableColumnClasses.status}>
        <Status status={_.capitalize(obj.info.status)} />
      </TableData>
      <TableData className={tableColumnClasses.chartName}>{obj.chart.metadata.name}</TableData>
      <TableData className={tableColumnClasses.chartVersion}>
        {obj.chart.metadata.version}
      </TableData>
      <TableData className={tableColumnClasses.appVersion}>
        {obj.chart.metadata.appVersion || '-'}
      </TableData>
      <TableData className={tableColumnClasses.kebab}>
        <LazyActionMenu context={{ 'helm-actions': actionsScope }} />
      </TableData>
    </>
  );
};

export default HelmReleaseListRow;
