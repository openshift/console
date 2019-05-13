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
import { fetchAlerts, fetchPrometheusQuery, getAlertManagerBaseURL, getPrometheusBaseURL } from '../../../kubevirt/components/dashboards';

const { warn } = console;

const CEPH_PG_CLEAN_AND_ACTIVE_QUERY = 'ceph_pg_clean and ceph_pg_active';
const CEPH_PG_TOTAL_QUERY = 'ceph_pg_total';

const UTILIZATION_IOPS_QUERY = '(sum(rate(ceph_pool_wr[1m])) + sum(rate(ceph_pool_rd[1m])))[360m:60m]';
//This query only count the latency for all drives in the configuration. Might go with same for the demo
const UTILIZATION_LATENCY_QUERY = '(quantile(.95,(cluster:ceph_disk_latency:join_ceph_node_disk_irate1m)))[360m:60m]';
const UTILIZATION_THROUGHPUT_QUERY = '(sum(rate(ceph_pool_wr_bytes[1m]) + rate(ceph_pool_rd_bytes[1m])))[360m:60m]';
const UTILIZATION_RECOVERY_RATE_QUERY = 'sum(ceph_pool_recovering_bytes_per_sec)[360m:60m]';
const TOP_CONSUMERS_QUERY = '(sum((max(kube_persistentvolumeclaim_status_phase{phase="Bound"}) by (namespace,pod,persistentvolumeclaim) ) * max(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h])) by (namespace,pod,persistentvolumeclaim)) by (namespace))[10m:1m]';

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
  topConsumers: 'topConsumers',
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

export class StorageOverview extends React.Component {
  constructor(props) {
    super(props);


    let initializePrometheus;

    if (!getPrometheusBaseURL()){
      warn('Prometheus BASE URL is missing!');
      initializePrometheus = {}; // data loaded
    }

    if (!getAlertManagerBaseURL()){
      warn('Alert Manager BASE URL is missing!');
    }
    this.state = {
      ...Object.keys(PROM_RESULT_CONSTANTS).reduce((initAcc, key) => {
        initAcc[PROM_RESULT_CONSTANTS[key]] = initializePrometheus;
        return initAcc;
      },{}),
    };

    this.onFetch = this._onFetch.bind(this);
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

  componentDidMount() {
    this._isMounted = true;

    if (getPrometheusBaseURL()) {
      fetchPrometheusQuery(CEPH_STATUS_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.ocsHealthResponse, response));
      fetchPrometheusQuery(CEPH_OSD_DOWN_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.cephOsdDown, response));
      fetchPrometheusQuery(CEPH_OSD_UP_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.cephOsdUp, response));
      fetchPrometheusQuery(UTILIZATION_IOPS_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.iopsUtilization, response));
      fetchPrometheusQuery(UTILIZATION_LATENCY_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.latencyUtilization, response));
      fetchPrometheusQuery(UTILIZATION_THROUGHPUT_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.throughputUtilization, response));
      fetchPrometheusQuery(UTILIZATION_RECOVERY_RATE_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.recoveryRateUtilization, response));
      fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_TOTAL_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.capacityTotal, response));
      fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_USED_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.capacityUsed, response));
      fetchPrometheusQuery(CEPH_PG_CLEAN_AND_ACTIVE_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.cleanAndActivePgRaw, response));
      fetchPrometheusQuery(CEPH_PG_TOTAL_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.totalPgRaw, response));

      fetchPrometheusQuery(TOP_CONSUMERS_QUERY, response => this.onFetch(PROM_RESULT_CONSTANTS.topConsumers, response));
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
