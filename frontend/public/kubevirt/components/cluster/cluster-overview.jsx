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
import { coFetch } from '../../../co-fetch';

import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from './events-inner-overview';
import { LoadingInline} from '../utils/okdutils';
import { LazyRenderer } from '../utils/lazyRenderer';
import { fetchPeriodically, fetchPrometheusQuery, getPrometheusQuery, getPrometheusMetrics, fetchAlerts } from '../dashboards';

const CONSUMERS_CPU_QUERY = 'sort(topk(5, pod_name:container_cpu_usage:sum))';
const CONSUMERS_MEMORY_QUERY = 'sort(topk(5, pod_name:container_memory_usage_bytes:sum))';

const CONSUMERS_STORAGE_QUERY = 'sort(topk(5, avg by (pod_name)(irate(container_fs_io_time_seconds_total{container_name="POD", pod_name!=""}[1m]))))';
const CONSUMERS_NETWORK_QUERY = `sort(topk(5, sum by (pod_name)(irate(container_network_receive_bytes_total{container_name="POD", pod_name!=""}[1m]) + 
  irate(container_network_transmit_bytes_total{container_name="POD", pod_name!=""}[1m]))))`;

const NODE_CONSUMERS_CPU_QUERY = 'sort(topk(5, node:node_cpu_utilisation:avg1m))';
const NODE_CONSUMERS_MEMORY_QUERY = 'sort(topk(5, node:node_memory_bytes_total:sum - node:node_memory_bytes_available:sum))';

const NODE_CONSUMERS_STORAGE_QUERY = 'sort(topk(5, node:node_disk_utilisation:avg_irate{cluster=""}))';
const NODE_CONSUMERS_NETWORK_QUERY = 'sort(topk(5, node:node_net_utilisation:sum_irate{cluster=""}))';

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

export class ClusterOverview extends React.Component {
  constructor(props){
    super(props);
    this.state = {};

    this.getStorageMetrics = this._getStorageMetrics.bind(this);
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

  async _getStorageMetrics() {
    let queryTotal = CAPACITY_STORAGE_TOTAL_DEFAULT_QUERY;
    let queryUsed = UTILIZATION_STORAGE_USED_DEFAULT_QUERY;
    try {
      const metrics = await getPrometheusMetrics();
      if (_.get(metrics, 'data', []).find(metric => metric === CAPACITY_STORAGE_TOTAL_BASE_CEPH_METRIC)) {
        const cephData = await getPrometheusQuery(CAPACITY_STORAGE_TOTAL_QUERY);
        if (getCapacityStats(cephData)) { // Ceph data are available
          queryTotal = CAPACITY_STORAGE_TOTAL_QUERY;
          queryUsed = UTILIZATION_STORAGE_USED_QUERY;
        }
      }
    } finally {
      fetchPrometheusQuery(queryTotal, result => this.onFetch('storageTotal', result));
      fetchPrometheusQuery(queryUsed, result => this.onFetch('storageUsed', result));
      fetchPrometheusQuery(UTILIZATION_STORAGE_IORW_QUERY, result => this.onFetch('storageIORW', result)); // Ceph only; will cause error and so the NOT_AVAILABLE state of the component without Cept
    }
  }

  fetchHealth() {
    const handleK8sHealthResponse = async response => {
      const text = await response.text();
      return {response : text};
    };
    fetchPeriodically(`${k8sBasePath}/healthz`, result => this.onFetch('k8sHealth', result), handleK8sHealthResponse, coFetch);
    fetchPeriodically(
      `${k8sBasePath}/apis/subresources.${VirtualMachineModel.apiGroup}/${VirtualMachineModel.apiVersion}/healthz`,
      result => this.onFetch('kubevirtHealth', result)
    );
    fetchPrometheusQuery(CEPH_STATUS_QUERY, result => this.onFetch('cephHealth', result));
  }

  componentDidMount() {
    this._isMounted = true;

    fetchPrometheusQuery(CONSUMERS_CPU_QUERY, result => this.onFetch('workloadCpuResults', result));
    fetchPrometheusQuery(CONSUMERS_MEMORY_QUERY, result => this.onFetch('workloadMemoryResults', result));
    fetchPrometheusQuery(CONSUMERS_STORAGE_QUERY, 'workloadStorageResults');
    fetchPrometheusQuery(CONSUMERS_NETWORK_QUERY, 'workloadNetworkResults');

    fetchPrometheusQuery(NODE_CONSUMERS_MEMORY_QUERY, result => this.onFetch('infraMemoryResults', result));
    fetchPrometheusQuery(NODE_CONSUMERS_CPU_QUERY, result => this.onFetch('infraCpuResults', result));

    fetchPrometheusQuery(NODE_CONSUMERS_STORAGE_QUERY, 'infraStorageResults');
    fetchPrometheusQuery(NODE_CONSUMERS_NETWORK_QUERY, 'infraNetworkResults');

    this.fetchHealth();

    fetchPrometheusQuery(OPENSHIFT_VERSION_QUERY, result => this.onFetch('openshiftClusterVersionResponse', result));

    fetchPrometheusQuery(CAPACITY_MEMORY_TOTAL_QUERY, result => this.onFetch('memoryTotal', result));
    fetchPrometheusQuery(CAPACITY_NETWORK_TOTAL_QUERY, result => this.onFetch('networkTotal', result));
    fetchPrometheusQuery(CAPACITY_NETWORK_USED_QUERY, result => this.onFetch('networkUsed', result));

    fetchPrometheusQuery(CEPH_OSD_UP_QUERY, result => this.onFetch('cephOsdUp', result));
    fetchPrometheusQuery(CEPH_OSD_DOWN_QUERY, result => this.onFetch('cephOsdDown', result));

    this.getStorageMetrics();

    fetchPrometheusQuery(UTILIZATION_CPU_USED_QUERY, result => this.onFetch('cpuUtilization', result));
    fetchPrometheusQuery(UTILIZATION_MEMORY_USED_QUERY, result => this.onFetch('memoryUtilization', result));
    fetchAlerts(result => this.onFetch('alertsResponse', result));
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
