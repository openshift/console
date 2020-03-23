import * as React from 'react';
import * as _ from 'lodash';
import { Status } from '@console/shared';
import { TableRow, TableData } from '@console/internal/components/factory';
import { Timestamp } from '@console/internal/components/utils';
import { tableColumnClasses } from './HelmReleaseHistoryHeader';
import { CustomResourceListRowProps } from '../custom-resource-list/custom-resource-list-types';

const HelmReleaseHistoryRow: React.FC<CustomResourceListRowProps> = ({
  obj,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={obj.name} index={index} trKey={key} style={style}>
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
        {obj.chart.metadata.appVersion}
      </TableData>
      <TableData className={tableColumnClasses.description}>{obj.info.description}</TableData>
    </TableRow>
  );
};

export default HelmReleaseHistoryRow;
