import * as React from 'react';
import * as _ from 'lodash';
import { Status } from '@console/shared';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { Timestamp, Kebab } from '@console/internal/components/utils';
import { confirmModal } from '@console/internal/components/modals';
import { coFetchJSON } from '@console/internal/co-fetch';
import { tableColumnClasses } from './HelmReleaseHistoryHeader';

const confirmModalRollbackHelmRelease = (
  releaseName: string,
  namespace: string,
  revision: number,
) => {
  const message = (
    <>
      Are you sure you want to rollback <strong>{releaseName}</strong> to{' '}
      <strong>Revision {revision}</strong>?
    </>
  );

  const payload = {
    namespace,
    name: releaseName,
    version: revision,
  };

  const executeFn = () => coFetchJSON.patch('/api/helm/release', payload);

  return {
    label: `Rollback to Revision ${revision}`,
    callback: () => {
      confirmModal({
        title: 'Rollback',
        btnText: 'Rollback',
        message,
        executeFn,
      });
    },
  };
};

const HelmReleaseHistoryRow: RowFunction = ({ obj, index, key, style }) => {
  const menuActions = [confirmModalRollbackHelmRelease(obj.name, obj.namespace, obj.version)];
  return (
    <TableRow id={obj.revision} index={index} trKey={key} style={style}>
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
      <TableData className={tableColumnClasses.kebab}>
        <Kebab options={menuActions} />
      </TableData>
    </TableRow>
  );
};

export default HelmReleaseHistoryRow;
