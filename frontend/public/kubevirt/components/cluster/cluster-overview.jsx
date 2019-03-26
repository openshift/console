import React from 'react';
import * as _ from 'lodash-es';
import {
  ClusterOverview as KubevirtClusterOverview,
  getResource,
  ClusterOverviewContext,
  complianceData,
  utilizationStats,
  formatCores,
  formatBytes,
  formatNetTraffic,
} from 'kubevirt-web-ui-components';

import { NodeModel, PodModel, PersistentVolumeClaimModel, VirtualMachineModel, InfrastructureModel } from '../../../models';
import { WithResources } from '../utils/withResources';
import { k8sBasePath } from '../../module/okdk8s';
import { coFetch, coFetchJSON } from '../../../co-fetch';

import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from './events-inner-overview';
import { LoadingInline } from '../utils/okdutils';

const CONSUMERS_CPU_QUERY = 'sort(topk(10, sum by (pod_name)(container_cpu_usage_seconds_total{pod_name!=""})))';
const CONSUMERS_MEMORY_QUERY = 'sort(topk(10, sum by (pod_name)(container_memory_usage_bytes{pod_name!=""})))';
const OPENSHIFT_VERSION_QUERY = 'openshift_build_info{job="apiserver"}';

const CAPACITY_CPU_TOTAL_QUERY = 'sum(kube_node_status_capacity_cpu_cores)';
const CAPACITY_CPU_USED_QUERY = 'sum(kube_node_status_capacity_cpu_cores) - sum(kube_node_status_allocatable_cpu_cores)';
const CAPACITY_MEMORY_TOTAL_QUERY = 'sum(kube_node_status_capacity_memory_bytes)';
const CAPACITY_MEMORY_USED_QUERY = 'sum(kube_node_status_capacity_memory_bytes) - sum(kube_node_status_allocatable_memory_bytes)';

const CAPACITY_STORAGE_TOTAL_QUERY = 'sum(kubelet_volume_stats_capacity_bytes)'; // available with Ceph
const CAPACITY_STORAGE_USED_QUERY = 'sum(kubelet_volume_stats_used_bytes)';
const CAPACITY_STORAGE_TOTAL_DEFAULT_QUERY = 'sum(node_filesystem_avail_bytes)';
const CAPACITY_STORAGE_USED_DEFAULT_QUERY = 'sum(node_filesystem_avail_bytes) - sum(node_filesystem_free_bytes)';

const CAPACITY_NETWORK_TOTAL_QUERY = 'sum(avg by(instance)(node_network_speed_bytes))'; // TODO: needs to be refined
const CAPACITY_NETWORK_USED_QUERY = 'sum(node:node_net_utilisation:sum_irate)';

const REFRESH_TIMEOUT = 30000;

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
};

const getInventoryData = resources => {
  const inventory = {};
  if (resources.nodes) {
    inventory.nodes = {
      data: resources.nodes,
      title: 'Hosts',
      kind: NodeModel.kind,
    };
  }
  if (resources.pods) {
    inventory.pods = {
      data: resources.pods,
      title: 'Pods',
      kind: PodModel.kind,
    };
  }
  if (resources.pvcs) {
    inventory.pvcs = {
      data: resources.pvcs,
      title: 'PVCs',
      kind: PersistentVolumeClaimModel.kind,
    };
  }
  if (resources.vms) {
    inventory.vms = {
      data: resources.vms,
      title: 'VMs',
      kind: VirtualMachineModel.kind,
    };
  }

  return {
    inventory,
    loaded: !!inventory,
  };
};

const OverviewEventStream = () => <EventStream scrollableElementId="events-body" InnerComponent={EventsInnerOverview} overview={true} namespace={undefined} />;

export class ClusterOverview extends React.Component {
  constructor(props){
    super(props);
    this.messages = {};

    this.state = {
      healthData: {
        data: {},
        loaded: false,
      },
      consumersData: {
        metrics: {
          cpu: {
            title: 'CPU',
            consumers: [],
          },
        },
        loaded: false,
      },
      capacityStats: {
        stats: {
          cpu: {
            title: 'CPU',
            data: {},
            formatValue: formatCores,
          },
          memory: {
            title: 'Memory',
            data: {},
            formatValue: formatBytes,
          },
          storage: {
            title: 'Storage',
            data: {},
            formatValue: formatBytes,
          },
          network: {
            title: 'Network',
            data: {},
            formatValue: formatNetTraffic,
          },
        },
      },
    };

    this.setConsumersData = this._setConsumersData.bind(this);
    this.setHealthData = this._setHealthData.bind(this);
    this.setDetailsOpenshiftResponse = this._setDetailsOpenshiftResponse.bind(this);
    this.setCapacityData = this._setCapacityData.bind(this);
  }

  _setConsumersData(key, title, response) {
    const result = response.data.result;
    this.setState(state => ({
      consumersData: {
        metrics: {
          ...(_.get(state.consumersData, 'metrics', {})),
          [key]: {
            title,
            consumers: result.map(r => ({
              kind: PodModel.kind,
              name: r.metric.pod_name,
              usage: r.value[1],
            })),
          },
        },
        loaded: true,
      },
    }));
  }

  _setHealthData(healthy, message) {
    this.setState({
      healthData: {
        data: {
          healthy,
          message,
        },
        loaded: true,
      },
    });
  }

  _setDetailsOpenshiftResponse(response) {
    this.setState(state => ({
      detailsData: {
        ...state.detailsData,
        openshiftVersionResponse: response,
      },
    }));
  }

  _setCapacityData(key, dataKey, response) {
    const result = response.data.result;
    this.setState(state => {
      const capacityStats = {
        stats: _.get(state.capacityStats, 'stats', {}),
      };

      const value = Number(_.get(result, '[0].value[1]'));
      if (!Number.isNaN(value)) {
        if (dataKey === 'totalDefault') {
          if (isNaN(capacityStats.stats[key].data.total)) {
            capacityStats.stats[key].data.total = value;
          }
        } else if (dataKey === 'usedDefault') {
          if (isNaN(capacityStats.stats[key].data.used)) {
            capacityStats.stats[key].data.used = value;
          }
        } else {
          capacityStats.stats[key].data[dataKey] = value;
        }
      }
      return { capacityStats };
    });
  }

  fetchPrometheusQuery(query, callback) {
    const promURL = window.SERVER_FLAGS.prometheusBaseURL;
    const url = `${promURL}/api/v1/query?query=${encodeURIComponent(query)}`;
    coFetchJSON(url).then(result => {
      if (this._isMounted) {
        callback(result);
      }
    }).then(() => {
      if (this._isMounted) {
        setTimeout(() => this.fetchPrometheusQuery(query, callback), REFRESH_TIMEOUT);
      }
    });
  }


  fetchHealth(callback) {
    coFetch(`${k8sBasePath}/healthz`)
      .then(response => response.text())
      .then(text => text === 'ok' && this._isMounted ? callback(true, 'All systems healthy') : callback(false, text))
      .catch(() => {
        if (this._isMounted) {
          callback(false, 'Cannot get cluster health');
        }
      })
      .then(() => {
        if (this._isMounted) {
          setTimeout(() => this.fetchHealth(callback), REFRESH_TIMEOUT);
        }
      });
  }

  componentDidMount() {
    this._isMounted = true;

    this.fetchPrometheusQuery(CONSUMERS_CPU_QUERY, response => this.setConsumersData('cpu', 'CPU', response));
    this.fetchPrometheusQuery(CONSUMERS_MEMORY_QUERY, response => this.setConsumersData('memory', 'Memory', response));

    this.fetchHealth(this.setHealthData);
    this.fetchPrometheusQuery(OPENSHIFT_VERSION_QUERY, response => this.setDetailsOpenshiftResponse(response));

    this.fetchPrometheusQuery(CAPACITY_CPU_TOTAL_QUERY, response => this.setCapacityData('cpu', 'total', response));
    this.fetchPrometheusQuery(CAPACITY_CPU_USED_QUERY, response => this.setCapacityData('cpu', 'used', response));
    this.fetchPrometheusQuery(CAPACITY_MEMORY_TOTAL_QUERY, response => this.setCapacityData('memory', 'total', response));
    this.fetchPrometheusQuery(CAPACITY_MEMORY_USED_QUERY, response => this.setCapacityData('memory', 'used', response));
    this.fetchPrometheusQuery(CAPACITY_STORAGE_TOTAL_QUERY, response => this.setCapacityData('storage', 'total', response));
    this.fetchPrometheusQuery(CAPACITY_STORAGE_USED_QUERY, response => this.setCapacityData('storage', 'used', response));
    this.fetchPrometheusQuery(CAPACITY_STORAGE_TOTAL_DEFAULT_QUERY, response => this.setCapacityData('storage', 'totalDefault', response));
    this.fetchPrometheusQuery(CAPACITY_STORAGE_USED_DEFAULT_QUERY, response => this.setCapacityData('storage', 'usedDefault', response));
    this.fetchPrometheusQuery(CAPACITY_NETWORK_TOTAL_QUERY, response => this.setCapacityData('network', 'total', response));
    this.fetchPrometheusQuery(CAPACITY_NETWORK_USED_QUERY, response => this.setCapacityData('network', 'used', response));
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          detailsData: {
            LoadingComponent: LoadingInline,
            infrastructure: resources.infrastructure,
            ...this.state.detailsData,
          },
          inventoryData: getInventoryData(resources), // k8s object loaded via WithResources
          healthData: this.state.healthData,
          capacityStats: {
            LoadingComponent: LoadingInline,
            ...this.state.capacityStats,
          },

          complianceData, // TODO: mock, replace by real data and remove from web-ui-components
          utilizationStats, // TODO: mock, replace by real data and remove from web-ui-components

          eventsData: {
            Component: OverviewEventStream,
            loaded: true,
          },

          consumersData: this.state.consumersData,
        },
      };
    };


    return (
      <WithResources resourceMap={resourceMap} resourceToProps={inventoryResourceMapToProps}>
        <ClusterOverviewContext.Provider>
          <KubevirtClusterOverview />
        </ClusterOverviewContext.Provider>
      </WithResources>
    );
  }
}
