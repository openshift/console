import React from 'react';
import * as _ from 'lodash-es';
import {
  ClusterOverview as KubevirtClusterOverview,
  getResource,
  ClusterOverviewContext,
  complianceData,
  getCapacityStats,
  STORAGE_PROMETHEUS_QUERIES,
} from 'kubevirt-web-ui-components';

import {
  NodeModel,
  PodModel,
  PersistentVolumeClaimModel,
  VirtualMachineModel,
  InfrastructureModel,
  VirtualMachineInstanceMigrationModel,
  BaremetalHostModel,
} from '../../../models';
import { WithResources } from '../utils/withResources';
import { k8sBasePath } from '../../module/okdk8s';
import { coFetch, coFetchJSON } from '../../../co-fetch';

import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from './events-inner-overview';
import { LoadingInline} from '../utils/okdutils';
import { LazyRenderer } from '../utils/lazyRenderer';

const CONSUMERS_CPU_QUERY = 'sort(topk(5, sum by (pod_name)(container_cpu_usage_seconds_total{pod_name!=""})))';
const CONSUMERS_MEMORY_QUERY = 'sort(topk(5, sum by (pod_name)(container_memory_usage_bytes{pod_name!=""})))';
const NODE_CONSUMERS_CPU_QUERY = 'sort(topk(5, kube_node_status_capacity_cpu_cores - kube_node_status_allocatable_cpu_cores))';
const NODE_CONSUMERS_MEMORY_QUERY = 'sort(topk(5, node:node_memory_bytes_total:sum - node:node_memory_bytes_available:sum))';
const OPENSHIFT_VERSION_QUERY = 'openshift_build_info{job="apiserver"}';

const CAPACITY_MEMORY_TOTAL_QUERY = 'sum(kube_node_status_capacity_memory_bytes)';

const CAPACITY_NETWORK_TOTAL_QUERY = 'sum(avg by(instance)(node_network_speed_bytes))'; // TODO(mlibra): needs to be refined
const CAPACITY_NETWORK_USED_QUERY = 'sum(node:node_net_utilisation:sum_irate)';

const UTILIZATION_CPU_USED_QUERY = '((sum(node:node_cpu_utilisation:avg1m) / count(node:node_cpu_utilisation:avg1m)) * 100)[60m:5m]';
const UTILIZATION_MEMORY_USED_QUERY = '(sum(kube_node_status_capacity_memory_bytes) - sum(kube_node_status_allocatable_memory_bytes))[60m:5m]'; // TOTAL is reused from CAPACITY_MEMORY_TOTAL_QUERY

const {
  CEPH_STATUS_QUERY,
  CEPH_OSD_UP_QUERY,
  CEPH_OSD_DOWN_QUERY,
  CAPACITY_STORAGE_TOTAL_BASE_CEPH_METRIC,
  CAPACITY_STORAGE_TOTAL_QUERY,
  CAPACITY_STORAGE_TOTAL_DEFAULT_QUERY,
  UTILIZATION_STORAGE_USED_QUERY,
  UTILIZATION_STORAGE_USED_DEFAULT_QUERY,
  UTILIZATION_STORAGE_IORW_QUERY,
} = STORAGE_PROMETHEUS_QUERIES;

const REFRESH_TIMEOUT = 5000;

const resourceMap = {
  nodes: {
    resource: getResource(NodeModel, {namespaced: false}),
  },
  pods: {
    resource: getResource(PodModel),
  },
  pvcs: {
    resource: getResource(PersistentVolumeClaimModel),
  },
  vms: {
    resource: getResource(VirtualMachineModel),
  },
  infrastructure: {
    resource: getResource(InfrastructureModel, { namespaced: false, name: 'cluster', isList: false }),
  },
  migrations: {
    resource: getResource(VirtualMachineInstanceMigrationModel),
  },
  hosts: {
    resource: getResource(BaremetalHostModel),
  },
};

const OverviewEventStream = () => <EventStream scrollableElementId="events-body" InnerComponent={EventsInnerOverview} overview={true} namespace={undefined} />;

const getPrometheusBaseURL = () => window.SERVER_FLAGS.prometheusBaseURL;

const getAlertManagerBaseURL = () => window.SERVER_FLAGS.alertManagerBaseURL;

export class ClusterOverview extends React.Component {
  constructor(props){
    super(props);
    this.state = {};

    this.getStorageMetrics = this._getStorageMetrics.bind(this);
  }

  async _getStorageMetrics() {
    let queryTotal = CAPACITY_STORAGE_TOTAL_DEFAULT_QUERY;
    let queryUsed = UTILIZATION_STORAGE_USED_DEFAULT_QUERY;
    try {
      const metrics = await this.getPrometheusMetrics();
      if (_.get(metrics, 'data', []).find(metric => metric === CAPACITY_STORAGE_TOTAL_BASE_CEPH_METRIC)) {
        const cephData = await this.getPrometheusQuery(CAPACITY_STORAGE_TOTAL_QUERY);
        if (getCapacityStats(cephData)) { // Ceph data are available
          queryTotal = CAPACITY_STORAGE_TOTAL_QUERY;
          queryUsed = UTILIZATION_STORAGE_USED_QUERY;
        }
      }
    } finally {
      this.fetchPrometheusQuery(queryTotal, 'storageTotal');
      this.fetchPrometheusQuery(queryUsed, 'storageUsed');
      this.fetchPrometheusQuery(UTILIZATION_STORAGE_IORW_QUERY, 'storageIORW'); // Ceph only; will cause error and so the NOT_AVAILABLE state of the component without Cept
    }
  }

  async getPrometheusMetrics() {
    const url = `${getPrometheusBaseURL()}/api/v1/label/__name__/values`;
    return coFetchJSON(url);
  }

  async getPrometheusQuery(query) {
    const url = `${getPrometheusBaseURL()}/api/v1/query?query=${encodeURIComponent(query)}`;
    return coFetchJSON(url);
  }

  fetchPrometheusQuery(query, key) {
    const url = `${getPrometheusBaseURL()}/api/v1/query?query=${encodeURIComponent(query)}`;
    this.fetchAndStore(url, key);
  }

  fetchHealth() {
    const handleK8sHealthResponse = async response => {
      const text = await response.text();
      return {response : text};
    };
    this.fetchAndStore(`${k8sBasePath}/healthz`, 'k8sHealth', handleK8sHealthResponse, coFetch);
    this.fetchAndStore(
      `${k8sBasePath}/apis/subresources.${VirtualMachineModel.apiGroup}/${VirtualMachineModel.apiVersion}/healthz`,
      'kubevirtHealth'
    );
    this.fetchPrometheusQuery(CEPH_STATUS_QUERY, 'cephHealth');
  }

  fetchAlerts() {
    const url = `${getAlertManagerBaseURL()}/api/v2/alerts?silenced=false&inhibited=false`;
    this.fetchAndStore(url, 'alertsResponse');
  }

  async fetchAndStore(url, key, responseHandler, fetchMethod = coFetchJSON) {
    let response;
    try {
      response = await fetchMethod(url);
      if (responseHandler) {
        response = await responseHandler(response);
      }
    } catch (error) {
      response = error;
    } finally {
      if (this._isMounted) {
        this.setState({
          [key]: response,
        });
        setTimeout(() => this.fetchAndStore(url, key, responseHandler, fetchMethod), REFRESH_TIMEOUT);
      }
    }
  }

  componentDidMount() {
    this._isMounted = true;

    this.fetchPrometheusQuery(CONSUMERS_CPU_QUERY, 'workloadCpuResults');
    this.fetchPrometheusQuery(CONSUMERS_MEMORY_QUERY, 'workloadMemoryResults');
    this.fetchPrometheusQuery(NODE_CONSUMERS_MEMORY_QUERY, 'infraMemoryResults');
    this.fetchPrometheusQuery(NODE_CONSUMERS_CPU_QUERY, 'infraCpuResults');

    this.fetchHealth();

    this.fetchPrometheusQuery(OPENSHIFT_VERSION_QUERY, 'openshiftClusterVersionResponse');

    this.fetchPrometheusQuery(CAPACITY_MEMORY_TOTAL_QUERY, 'memoryTotal');
    this.fetchPrometheusQuery(CAPACITY_NETWORK_TOTAL_QUERY, 'networkTotal');
    this.fetchPrometheusQuery(CAPACITY_NETWORK_USED_QUERY, 'networkUsed');

    this.fetchPrometheusQuery(CEPH_OSD_UP_QUERY, 'cephOsdUp');
    this.fetchPrometheusQuery(CEPH_OSD_DOWN_QUERY, 'cephOsdDown');

    this.getStorageMetrics();

    this.fetchPrometheusQuery(UTILIZATION_CPU_USED_QUERY, 'cpuUtilization');
    this.fetchPrometheusQuery(UTILIZATION_MEMORY_USED_QUERY, 'memoryUtilization');
    this.fetchAlerts();
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

          eventsData: {
            Component: OverviewEventStream,
            loaded: true,
          },
          complianceData, // TODO: mock, replace by real data and remove from web-ui-components
        },
      };
    };


    return (
      <WithResources resourceMap={resourceMap} resourceToProps={inventoryResourceMapToProps}>
        <LazyRenderer>
          <ClusterOverviewContext.Provider>
            <KubevirtClusterOverview />
          </ClusterOverviewContext.Provider>
        </LazyRenderer>
      </WithResources>
    );
  }
}
