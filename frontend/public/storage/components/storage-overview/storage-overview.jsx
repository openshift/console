import React from 'react';

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
import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from '../../../kubevirt/components/cluster/events-inner-overview';
import { LazyRenderer } from '../../../kubevirt/components/utils/lazyRenderer';
import { fetchAlerts, fetchPrometheusQuery, getAlertManagerBaseURL, getPrometheusBaseURL, stopPrometheusQuery } from '../../../kubevirt/components/dashboards';

const { warn } = console;

const CEPH_PG_CLEAN_AND_ACTIVE_QUERY = 'ceph_pg_clean and ceph_pg_active';
const CEPH_PG_TOTAL_QUERY = 'ceph_pg_total';

const UTILIZATION_IOPS_QUERY = '(sum(rate(ceph_pool_wr[1m])) + sum(rate(ceph_pool_rd[1m])))';
//This query only count the latency for all drives in the configuration. Might go with same for the demo
const UTILIZATION_LATENCY_QUERY = '(quantile(.95,(cluster:ceph_disk_latency:join_ceph_node_disk_irate1m)))';
const UTILIZATION_THROUGHPUT_QUERY = '(sum(rate(ceph_pool_wr_bytes[1m]) + rate(ceph_pool_rd_bytes[1m])))';
const UTILIZATION_RECOVERY_RATE_QUERY = '(sum(ceph_pool_recovering_bytes_per_sec))';
const CONSUMERS_PROJECT_REQUESTED_CAPACITY_QUERY = '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass) kube_persistentvolumeclaim_info) by (namespace))))[10m:1m]';
const CONSUMERS_PROJECT_USED_CAPACITY_QUERY = '(sort(topk(5, sum(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass) kube_persistentvolumeclaim_info) by (namespace))))[10m:1m]';
const CONSUMERS_SLCLASSES_REQUESTED_CAPACITY_QUERY = '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass) kube_persistentvolumeclaim_info) by (storageclass))))[10m:1m]';
const CONSUMERS_SLCLASSES_USED_CAPACITY_QUERY = '(sort(topk(5, sum(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass) kube_persistentvolumeclaim_info) by (storageclass))))[10m:1m]';
const CONSUMERS_PODS_REQUESTED_CAPACITY_QUERY = '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(pod) kube_pod_spec_volumes_persistentvolumeclaims_info) by (pod))))[10m:1m]';
const CONSUMERS_PODS_USED_CAPACITY_QUERY = '(sort(topk(5, sum(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(pod) kube_pod_spec_volumes_persistentvolumeclaims_info) by (pod))))[10m:1m]';
const {
  CEPH_STATUS_QUERY,
  CEPH_OSD_UP_QUERY,
  CEPH_OSD_DOWN_QUERY,
  STORAGE_CEPH_CAPACITY_TOTAL_QUERY,
  STORAGE_CEPH_CAPACITY_USED_QUERY,
} = STORAGE_PROMETHEUS_QUERIES;

const PROM_RESULT_CONSTANTS = {
  ocsHealthResponse: 'ocsHealthResponse',
  cephOsdDown: 'cephOsdDown',
  cephOsdUp: 'cephOsdUp',
  iopsUtilization: 'iopsUtilization',
  latencyUtilization: 'latencyUtilization',
  throughputUtilization: 'throughputUtilization',
  recoveryRateUtilization: 'recoveryRateUtilization',
  capacityTotal: 'capacityTotal',
  capacityUsed: 'capacityUsed',
  cleanAndActivePgRaw: 'cleanAndActivePgRaw',
  totalPgRaw: 'totalPgRaw',
  projectsRequestedCapacity: 'projectsRequestedCapacity',
  projectsUsedCapacity: 'projectsUsedCapacity',
  slClassesRequestedCapacity: 'slClassesRequestedCapacity',
  slClassesUsedCapacity: 'slClassesUsedCapacity',
  podsRequestedCapacity: 'podsRequestedCapacity',
  podsUsedCapacity: 'podsUsedCapacity',
  oneHour: '[1h:10m]',
  sixHours: '[6h:1h]',
  twentyFourHours: '[24h:4h]',
};


const HourMap = {
  '1 Hour': PROM_RESULT_CONSTANTS.oneHour,
  '6 Hours': PROM_RESULT_CONSTANTS.sixHours,
  '24 Hours': PROM_RESULT_CONSTANTS.twentyFourHours,
};

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

const EventStreamComponent = () => <EventStream scrollableElementId="events-body" InnerComponent={EventsInnerOverview} overview={true} namespace={undefined} filter={[pvcFilter, podFilter]} />;

const timers = {};

export class StorageOverview extends React.Component {
  constructor(props) {
    super(props);


    let initializePrometheus;

    if (!getPrometheusBaseURL()) {
      warn('Prometheus BASE URL is missing!');
      initializePrometheus = {}; // data loaded
    }

    if (!getAlertManagerBaseURL()) {
      warn('Alert Manager BASE URL is missing!');
    }
    this.state = {
      ...Object.keys(PROM_RESULT_CONSTANTS).reduce((initAcc, key) => {
        initAcc[PROM_RESULT_CONSTANTS[key]] = initializePrometheus;
        return initAcc;
      }, {}),
    };

    this.onFetch = this._onFetch.bind(this);
    this.utilizationCallback = this.utilizationCallback.bind(this);
  }

  _onFetch(key, response) {
    if (this._isMounted) {
      this.setState({
        [key]: response,
      });
      return true;
    }
    return false;
  }

  utilizationCallback(duration) {

    stopPrometheusQuery(timers.iopsTimer);
    stopPrometheusQuery(timers.latencyTimer);
    stopPrometheusQuery(timers.throughputTimer);
    stopPrometheusQuery(timers.recoveryRateTimer);

    fetchPrometheusQuery(`${UTILIZATION_IOPS_QUERY}${HourMap[duration]}`, response => this.onFetch(PROM_RESULT_CONSTANTS.iopsUtilization, response), id => this.onTimeoutScheduled(id, 'iops'));
    fetchPrometheusQuery(`${UTILIZATION_LATENCY_QUERY}${HourMap[duration]}`, response => this.onFetch(PROM_RESULT_CONSTANTS.latencyUtilization, response), id => this.onTimeoutScheduled(id, 'latency'));
    fetchPrometheusQuery(`${UTILIZATION_THROUGHPUT_QUERY}${HourMap[duration]}`, response => this.onFetch(PROM_RESULT_CONSTANTS.throughputUtilization, response), id => this.onTimeoutScheduled(id, 'throughput'));
    fetchPrometheusQuery(`${UTILIZATION_RECOVERY_RATE_QUERY}${HourMap[duration]}`, response => this.onFetch(PROM_RESULT_CONSTANTS.recoveryRateUtilization, response), id => this.onTimeoutScheduled(id, 'recoveryRate'));

  }

  onTimeoutScheduled(id, type) {
    timers[`${type}Timer`] = id;
  }

  componentDidMount() {
    this._isMounted = true;

    if (getPrometheusBaseURL()) {
      fetchPrometheusQuery(CEPH_STATUS_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.ocsHealthResponse, response));
      fetchPrometheusQuery(CEPH_OSD_DOWN_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.cephOsdDown, response));
      fetchPrometheusQuery(CEPH_OSD_UP_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.cephOsdUp, response));

      fetchPrometheusQuery(`${UTILIZATION_IOPS_QUERY}${PROM_RESULT_CONSTANTS.sixHours}`, response => this.onFetch(PROM_RESULT_CONSTANTS.iopsUtilization, response), id => this.onTimeoutScheduled(id, 'iops'));
      fetchPrometheusQuery(`${UTILIZATION_LATENCY_QUERY}${PROM_RESULT_CONSTANTS.sixHours}`, response => this.onFetch(PROM_RESULT_CONSTANTS.latencyUtilization, response), id => this.onTimeoutScheduled(id, 'latency'));
      fetchPrometheusQuery(`${UTILIZATION_THROUGHPUT_QUERY}${PROM_RESULT_CONSTANTS.sixHours}`, response => this.onFetch(PROM_RESULT_CONSTANTS.throughputUtilization, response), id => this.onTimeoutScheduled(id, 'throughput'));
      fetchPrometheusQuery(`${UTILIZATION_RECOVERY_RATE_QUERY}${PROM_RESULT_CONSTANTS.sixHours}`, response => this.onFetch(PROM_RESULT_CONSTANTS.recoveryRateUtilization, response), id => this.onTimeoutScheduled(id, 'recoveryRate'));

      fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_TOTAL_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.capacityTotal, response));
      fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_USED_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.capacityUsed, response));
      fetchPrometheusQuery(CEPH_PG_CLEAN_AND_ACTIVE_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.cleanAndActivePgRaw, response));
      fetchPrometheusQuery(CEPH_PG_TOTAL_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.totalPgRaw, response));

      fetchPrometheusQuery(CONSUMERS_PROJECT_REQUESTED_CAPACITY_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.projectsRequestedCapacity, response));
      fetchPrometheusQuery(CONSUMERS_PROJECT_USED_CAPACITY_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.projectsUsedCapacity, response));
      fetchPrometheusQuery(CONSUMERS_SLCLASSES_REQUESTED_CAPACITY_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.slClassesRequestedCapacity, response));
      fetchPrometheusQuery(CONSUMERS_SLCLASSES_USED_CAPACITY_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.slClassesUsedCapacity, response));
      fetchPrometheusQuery(CONSUMERS_PODS_REQUESTED_CAPACITY_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.podsRequestedCapacity, response));
      fetchPrometheusQuery(CONSUMERS_PODS_USED_CAPACITY_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.podsUsedCapacity, response));
    }

    if (getAlertManagerBaseURL()) {
      fetchAlerts(result => this.onFetch('alertsResponse', result));
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          LoadingComponent: LoadingInline,
          ...resources,
          ...this.state,
          EventStreamComponent,
          utilizationCallback: this.utilizationCallback,
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
