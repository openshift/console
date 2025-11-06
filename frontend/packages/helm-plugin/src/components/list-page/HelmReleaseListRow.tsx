import { Link } from 'react-router-dom-v5-compat';
import {
  getNameCellProps,
  actionsCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { ResourceIcon, ResourceLink } from '@console/internal/components/utils';
import { DASH, LazyActionMenu, Status } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { HelmRelease, HelmActionOrigins } from '../../types/helm-types';
import { HelmReleaseStatusLabels, releaseStatus } from '../../utils/helm-utils';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'revision' },
  { id: 'updated' },
  { id: 'status' },
  { id: 'chart-name' },
  { id: 'chart-version' },
  { id: 'app-version' },
  { id: 'actions' },
];

export const getDataViewRows: GetDataViewRows<HelmRelease, { obj: HelmRelease }> = (
  data,
  columns,
) => {
  return data.map(({ obj: release }) => {
    const actionsScope = {
      release,
      actionOrigin: HelmActionOrigins.list,
    };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <>
            <ResourceIcon kind="Helm Release" />
            <Link
              to={`/helm-releases/ns/${release.namespace}/release/${release.name}`}
              title={release.name}
              className="co-resource-item__resource-name"
            >
              {release.name}
            </Link>
          </>
        ),
        props: getNameCellProps('helm-release'),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={release.namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: release.version,
      },
      [tableColumnInfo[3].id]: {
        cell: <Timestamp timestamp={release.info.last_deployed} />,
      },
      [tableColumnInfo[4].id]: {
        cell: (
          <Status
            status={releaseStatus(release.info.status)}
            title={HelmReleaseStatusLabels[release.info.status]}
          />
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: release.chart.metadata.name,
      },
      [tableColumnInfo[6].id]: {
        cell: release.chart.metadata.version,
      },
      [tableColumnInfo[7].id]: {
        cell: release.chart.metadata.appVersion || DASH,
      },
      [tableColumnInfo[8].id]: {
        cell: <LazyActionMenu context={{ 'helm-actions': actionsScope }} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cellData = rowCells[id];
      return {
        id,
        props: cellData?.props,
        cell: cellData?.cell || DASH,
      };
    });
  });
};

export default getDataViewRows;
