import * as React from 'react';
import * as _ from 'lodash';
import { Status, RadioButtonField } from '@console/shared';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { Timestamp } from '@console/internal/components/utils';
import { tableColumnClasses } from './RevisionListHeader';

const RevisionListRow: RowFunction = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.revision} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses.input}>
        <RadioButtonField value={obj.version} name="revision" />
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
      <TableData className={tableColumnClasses.description}>{obj.info.description}</TableData>
    </TableRow>
  );
};

export default RevisionListRow;
