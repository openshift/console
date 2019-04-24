import React from 'react';
import { get } from 'lodash-es';

import {
  StorageOverview as KubevirtStorageOverview,
  StorageOverviewContext,
  getResource,
  STORAGE_PROMETHEUS_QUERIES,
} from 'kubevirt-web-ui-components';

import {
  CephClusterModel,
  NodeModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
  PodModel,
} from '../../../models';

import { WithResources } from '../../../kubevirt/components/utils/withResources';
import { LoadingInline } from '../../../kubevirt/components/utils/okdutils';
import { coFetchJSON } from '../../../co-fetch';
import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from '../../../kubevirt/components/cluster/events-inner-overview';
import { LazyRenderer } from '../../../kubevirt/components/utils/lazyRenderer';

const REFRESH_TIMEOUT = 3000;

const CEPH_PG_CLEAN_AND_ACTIVE_QUERY = 'ceph_pg_clean and ceph_pg_active';
const CEPH_PG_TOTAL_QUERY = 'ceph_pg_total';

const UTILIZATION_IOPS_QUERY = '(sum(rate(ceph_pool_wr[1m])) + sum(rate(ceph_pool_rd[1m])))[10m:30s]';
//This query only count the latency for all drives in the configuration. Might go with same for the demo
const UTILIZATION_LATENCY_QUERY = '(quantile(.95,(cluster:ceph_disk_latency:join_ceph_node_disk_irate1m)))[10m:30s]';
const UTILIZATION_THROUGHPUT_QUERY = '(sum(rate(ceph_pool_wr_bytes[1m]) + rate(ceph_pool_rd_bytes[1m])))[10m:30s]';
const UTILIZATION_RECOVERY_RATE_QUERY = 'sum(ceph_pool_recovering_bytes_per_sec)[10m:30s]';
const TOP_CONSUMERS_QUERY = '(sum((max(kube_persistentvolumeclaim_status_phase{phase="Bound"}) by (namespace,pod,persistentvolumeclaim) ) * max(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h])) by (namespace,pod,persistentvolumeclaim)) by (namespace))[10m:1m]';

const {
  CEPH_STATUS_QUERY,
  CEPH_OSD_UP_QUERY,
  CEPH_OSD_DOWN_QUERY,
  STORAGE_CEPH_CAPACITY_TOTAL_QUERY,
  STORAGE_CEPH_CAPACITY_USED_QUERY,
} = STORAGE_PROMETHEUS_QUERIES;

const resourceMap = {
  nodes: {
    resource: getResource(NodeModel, { namespaced: false }),
  },
  pvs: {
    resource: getResource(PersistentVolumeModel),
  },
  pvcs: {
    resource: getResource(PersistentVolumeClaimModel),
  },
  cephCluster: {
    resource: getResource(CephClusterModel),
  },
};

const pvcFilter = ({ kind }) => PersistentVolumeClaimModel.kind === kind;
const podFilter = ({ kind, namespace }) => PodModel.kind === kind && namespace === 'openshift-storage';

const getPrometheusBaseURL = () => window.SERVER_FLAGS.prometheusBaseURL;

const getAlertManagerBaseURL = () => window.SERVER_FLAGS.alertManagerBaseURL;

const OverviewEventStream = () => <EventStream scrollableElementId="events-body" InnerComponent={EventsInnerOverview} overview={true} namespace={undefined} filter={[pvcFilter, podFilter]} />;

export class StorageOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ocsHealthData: {
        LoadingComponent: LoadingInline,
      },
      topConsumersData: {
        topConsumerStats: [],
        topConsumersLoaded: false,
      },
      capacityData: {},
      diskStats: {},
      utilizationData: {},
      dataResiliencyData: {},
    };
    this.setHealthData = this._setHealthData.bind(this);
    this.setTopConsumersData = this._setTopConsumersData.bind(this);
    this.setData = this._setData.bind(this);
  }

  _setHealthData(response) {
    this.setState(state => ({
      ocsHealthData: {
        ...state.ocsHealthData,
        response,
      },
    }));
  }

  _setData(key, responseKey, response) {
    this.setState(state => ({
      [key]: {
        ...state[key],
        [responseKey]: response,
      },
    }));
  }

  _setTopConsumersData(response) {
    const result = get(response, 'data.result', []);
    this.setState({
      topConsumersData: {
        topConsumerStats: result,
        topConsumerLoaded: true,
      },
    });
  }

  fetchPrometheusQuery(query, callback) {
    const url = `${getPrometheusBaseURL()}/api/v1/query?query=${encodeURIComponent(query)}`;
    coFetchJSON(url).then(result => {
      if (this._isMounted) {
        callback(result);
      }
    }).catch(error => {
      if (this._isMounted) {
        callback(error);
      }
    }).then(() => {
      if (this._isMounted) {
        setTimeout(() => this.fetchPrometheusQuery(query, callback), REFRESH_TIMEOUT);
      }
    });
  }

  async fetchAlerts() {
    const url = `${getAlertManagerBaseURL()}/api/v2/alerts?silenced=false&inhibited=false`;
    let alertsResponse;
    try {
      alertsResponse = await coFetchJSON(url);
    } catch (error) {
      alertsResponse = error;
    } finally {
      if (this._isMounted) {
        this.setState({
          alertsResponse,
        });
        setTimeout(() => this.fetchAlerts(), REFRESH_TIMEOUT);
      }
    }
  }

  componentDidMount() {
    this._isMounted = true;

    this.fetchPrometheusQuery(CEPH_STATUS_QUERY, this.setHealthData);
    this.fetchPrometheusQuery(CEPH_OSD_DOWN_QUERY, response => this.setData('diskStats', 'cephOsdDown', response));
    this.fetchPrometheusQuery(CEPH_OSD_UP_QUERY, response => this.setData('diskStats', 'cephOsdUp', response));
    this.fetchPrometheusQuery(UTILIZATION_IOPS_QUERY, response => this.setData('utilizationData', 'iopsUtilization', response));
    this.fetchPrometheusQuery(UTILIZATION_LATENCY_QUERY, response => this.setData('utilizationData', 'latencyUtilization', response));
    this.fetchPrometheusQuery(UTILIZATION_THROUGHPUT_QUERY, response => this.setData('utilizationData', 'throughputUtilization', response));
    this.fetchPrometheusQuery(UTILIZATION_RECOVERY_RATE_QUERY, response => this.setData('utilizationData', 'recoveryRateUtilization', response));
    this.fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_TOTAL_QUERY, response => this.setData('capacityData', 'capacityTotal', response));
    this.fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_USED_QUERY, response => this.setData('capacityData', 'capacityUsed', response));
    this.fetchPrometheusQuery(CEPH_PG_CLEAN_AND_ACTIVE_QUERY, response => this.setData('dataResiliencyData', 'cleanAndActivePgRaw', response));
    this.fetchPrometheusQuery(CEPH_PG_TOTAL_QUERY, response => this.setData('dataResiliencyData', 'totalPgRaw', response));

    this.fetchAlerts();
    this.fetchPrometheusQuery(TOP_CONSUMERS_QUERY, response => this.setTopConsumersData(response));
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { ocsHealthData, capacityData, diskStats, utilizationData, alertsResponse, topConsumersData, dataResiliencyData } = this.state;
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          LoadingComponent: LoadingInline,
          ...resources,
          ocsHealthData,
          ...capacityData,
          diskStats,
          eventsData: {
            Component: OverviewEventStream,
            loaded: true,
          },
          ...utilizationData,
          alertsResponse,
          ...topConsumersData,
          ...dataResiliencyData,
        },
      };
    };

    return (
      <WithResources
        resourceMap={resourceMap}
        resourceToProps={inventoryResourceMapToProps}
      >
        <LazyRenderer>
          <StorageOverviewContext.Provider>
            <KubevirtStorageOverview />
          </StorageOverviewContext.Provider>
        </LazyRenderer>
      </WithResources>
    );
  }
}
