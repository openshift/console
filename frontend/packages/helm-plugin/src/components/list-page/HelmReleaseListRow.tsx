import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { Timestamp, ResourceIcon } from '@console/internal/components/utils';
import { ActionsLoader, ActionMenu, Status } from '@console/shared';
import { HelmRelease, HelmActionOrigins } from '../../types/helm-types';
import { tableColumnClasses } from './HelmReleaseListHeader';

const HelmReleaseListRow: RowFunction<HelmRelease> = ({ obj, index, key, style }) => {
  const actionsScope = {
    releaseName: obj.name,
    namespace: obj.namespace,
    actionOrigin: HelmActionOrigins.list,
  };
  return (
    <TableRow id={obj.name} index={index} trKey={key} style={style}>
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
        <ActionsLoader contextId="helm-actions" scope={actionsScope}>
          {(loader) =>
            loader.loaded && <ActionMenu actions={loader.actions} options={loader.options} />
          }
        </ActionsLoader>
      </TableData>
    </TableRow>
  );
};

export default HelmReleaseListRow;
