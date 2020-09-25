import * as React from 'react';
import * as _ from 'lodash';
import * as cx from 'classnames';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import {
  Table,
  TableProps,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { humanizeBinaryBytes, Kebab } from '@console/internal/components/utils';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import {
  osdDiskInfoMetric,
  DATA_RESILIENCY_QUERY,
  StorageDashboardQuery,
} from '@console/ceph-storage-plugin/src/constants/queries';
import { TemplateInstanceModel } from '@console/internal/models';
import { TemplateInstanceKind } from '@console/internal/module/k8s';
import { PrometheusResult } from '@console/internal/components/graphs';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { RootState } from '@console/internal/redux';
import { NotificationAlerts } from '@console/internal/reducers/ui';
import { Alert } from '@console/internal/components/monitoring/types';
import { DiskMetadata } from '@console/local-storage-operator-plugin/src/components/disks-list/types';
import {
  NodesDisksListPage,
  NodesDisksListPageProps,
} from '@console/local-storage-operator-plugin/src/components/disks-list/disks-list-page';
import {
  CEPH_STORAGE_NAMESPACE,
  OSD_DOWN_ALERT,
  OSD_DOWN_AND_OUT_ALERT,
} from '../../../constants/index';
import { OCSKebabOptions } from './ocs-kebab-options';
import { OCSStatus } from './ocs-status-column';
import {
  ActionType,
  OCSColumnState,
  initialState,
  reducer,
  OCSDiskList,
  OCSColumnStateAction,
  Status,
  OCSDiskStatus,
} from './state-reducer';

export const getTiBasedStatus = (status: string): OCSDiskStatus => {
  switch (status) {
    case 'NotReady':
      return Status.PreparingToReplace;
    case 'Ready':
      return Status.ReplacementReady;
    case 'InstantiateFailure':
      return Status.ReplacementFailed;
    default:
      return null;
  }
};

const getAlertsBasedStatus = (alertName: string): OCSDiskStatus => {
  switch (alertName) {
    case OSD_DOWN_ALERT:
      return Status.NotResponding;
    case OSD_DOWN_AND_OUT_ALERT:
      return Status.Offline;
    default:
      return null;
  }
};

const tiResource: WatchK8sResource = {
  kind: TemplateInstanceModel.kind,
  namespace: CEPH_STORAGE_NAMESPACE,
  isList: true,
};

export const tableColumnClasses = [
  '',
  '',
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-2xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-lg'),
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const diskHeader = () => [
  {
    title: 'Name',
    sortField: 'path',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Disk State',
    sortField: 'status.state',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'OCS Status',
    sortField: '',
    transforms: [],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Type',
    sortField: 'type',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Model',
    sortField: 'model',
    transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  },
  {
    title: 'Capacity',
    sortField: 'size',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  },
  {
    title: 'Filesystem',
    sortField: 'fstype',
    transforms: [sortable],
    props: { className: tableColumnClasses[5] },
  },
  {
    title: '',
    sortField: '',
    transforms: [],
    props: { className: tableColumnClasses[6] },
  },
];

const diskRow: RowFunction<DiskMetadata, OCSMetadata> = ({
  obj,
  index,
  key,
  style,
  customData,
}) => {
  const { ocsState, dispatch } = customData;
  const diskName = obj.path;
  return (
    <TableRow id={obj.deviceID} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>{obj.path}</TableData>
      <TableData className={tableColumnClasses[1]}>{obj.status.state}</TableData>
      <OCSStatus ocsState={ocsState} diskName={diskName} className={tableColumnClasses[1]} />
      <TableData className={tableColumnClasses[2]}>{obj.type || '-'}</TableData>
      <TableData className={cx(tableColumnClasses[3], 'co-break-word')}>
        {obj.model || '-'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {humanizeBinaryBytes(obj.size).string || '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>{obj.fstype || '-'}</TableData>
      <OCSKebabOptions
        diskName={diskName}
        alertsMap={ocsState.metricsMap}
        replacementMap={ocsState.replacementMap}
        isRebalancing={ocsState.isRebalancing}
        dispatch={dispatch}
      />
    </TableRow>
  );
};

const OCSDisksList: React.FC<TableProps> = React.memo((props) => {
  const [ocsState, dispatch] = React.useReducer(reducer, initialState);

  const [cephDiskData, cephDiskLoadError, cephDiskLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: osdDiskInfoMetric({ nodeName: props.customData.node }),
  });
  const [progressData, progressLoadError, progressLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS],
  });
  const [tiData, tiLoaded, tiLoadError] = useK8sWatchResource<TemplateInstanceKind[]>(tiResource);
  const { data: alertsData, loaded: alertsLoaded, loadError: alertsLoadError } = useSelector<
    RootState,
    NotificationAlerts
  >(({ UI }) => UI.getIn(['monitoring', 'notificationAlerts']));

  const error = alertsLoadError || cephDiskLoadError || progressLoadError;
  const isLoading = !alertsLoaded || cephDiskLoading || progressLoading;

  if (!error && !isLoading) {
    const resiliencyResults: string = progressData?.data.result?.[0]?.value[1];
    const isRebalancing: boolean = resiliencyResults ? resiliencyResults !== '1' : false;

    const cephDisks: PrometheusResult[] = cephDiskData?.data?.result || [];
    const newMetricsMap: OCSDiskList = cephDisks.reduce((ocsDiskList: OCSDiskList, { metric }) => {
      ocsDiskList[metric.device] = {
        osd: metric.ceph_daemon,
        status: Status.Online,
      };
      return ocsDiskList;
    }, {});
    const newAlertsMap: OCSDiskList = alertsData.reduce(
      (ocsDiskList: OCSDiskList, alert: Alert) => {
        const { rule, labels } = alert;
        const status = getAlertsBasedStatus(rule.name);
        if (status) ocsDiskList[labels.device] = { osd: labels.disk, status };
        return ocsDiskList;
      },
      {},
    );

    if (!_.isEqual(newMetricsMap, ocsState.metricsMap)) {
      dispatch({ type: ActionType.SET_METRICS_MAP, payload: newMetricsMap });
    }

    if (!_.isEqual(newAlertsMap, ocsState.alertsMap)) {
      dispatch({ type: ActionType.SET_ALERTS_MAP, payload: newAlertsMap });
    }

    if (ocsState.isRebalancing !== isRebalancing) {
      dispatch({ type: ActionType.SET_IS_REBALANCING, payload: isRebalancing });
    }

    if (tiLoaded && !tiLoadError && tiData.length) {
      const newData: OCSDiskList = tiData.reduce((data, ti) => {
        const disk = ti.metadata.annotations?.disk;
        const osd = ti.metadata.annotations?.osd;
        if (osd && disk) {
          data[disk] = {
            osd,
            status: getTiBasedStatus(ti.status.conditions?.[0].type),
          };
        }
        return data;
      }, {});
      if (!_.isEqual(newData, ocsState.replacementMap)) {
        dispatch({
          type: ActionType.SET_REPLACEMENT_MAP,
          payload: newData,
        });
      }
    }
  }

  return (
    <Table
      {...props}
      aria-label="Disks List"
      Header={diskHeader}
      Row={diskRow}
      customData={{ ocsState, dispatch }}
      virtualize
    />
  );
});

export const OCSNodesDiskListPage = (props: NodesDisksListPageProps) => (
  <NodesDisksListPage obj={props.obj} ListComponent={OCSDisksList} />
);

type OCSMetadata = {
  ocsState: OCSColumnState;
  dispatch: React.Dispatch<OCSColumnStateAction>;
};
