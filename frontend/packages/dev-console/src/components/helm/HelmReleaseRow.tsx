import * as React from 'react';
import * as _ from 'lodash';
import { Status } from '@console/shared';
import { TableRow, TableData } from '@console/internal/components/factory';
import { Timestamp, Kebab } from '@console/internal/components/utils';
import { Link } from 'react-router-dom';
import { HelmRelease } from './helm-types';
import { tableColumnClasses } from './HelmReleaseHeader';
import { deleteHelmRelease } from '../../actions/modify-helm-release';

interface HelmReleaseRowProps {
  obj: HelmRelease;
  index: number;
  key?: string;
  style: object;
}

const HelmReleaseRow: React.FC<HelmReleaseRowProps> = ({ obj, index, key, style }) => {
  const menuActions = [deleteHelmRelease(obj.name, obj.namespace)];
  return (
    <TableRow id={obj.name} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses.name}>
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
      <TableData className={tableColumnClasses.appVersion}>
        {obj.chart.metadata.appVersion}
      </TableData>
      <TableData className={tableColumnClasses.kebab}>
        <Kebab options={menuActions} />
      </TableData>
    </TableRow>
  );
};

export default HelmReleaseRow;
