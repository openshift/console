import React from 'react';
import * as _ from 'lodash-es';
import {
  ClusterOverview as KubevirtClusterOverview,
  getResource,
  ClusterOverviewContext,

  complianceData,
  utilizationStats,
  capacityStats,
} from 'kubevirt-web-ui-components';

import { NodeModel, PodModel, PersistentVolumeClaimModel, VirtualMachineModel, InfrastructureModel } from '../../../models';
import { WithResources } from '../utils/withResources';
import { k8sBasePath, k8sGet } from '../../module/okdk8s';
import { coFetch, coFetchJSON } from '../../../co-fetch';

import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from './events-inner-overview';

const CONSUMERS_CPU_QUERY = 'sort(topk(10, sum by (pod_name)(container_cpu_usage_seconds_total{pod_name!=""})))';
const CONSUMERS_MEMORY_QUERY = 'sort(topk(10, sum by (pod_name)(container_memory_usage_bytes{pod_name!=""})))';

const REFRESH_TIMEOUT = 30000;

const inventoryResourceMap = {
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

const OverviewEventStream = () => <EventStream InnerComponent={EventsInnerOverview} overview={true} />; // TODO FIX: the "namespace" is required prop

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
      detailsData: {
        data: {},
        loaded: false,
      },
    };

    this.setConsumersData = this._setConsumersData.bind(this);
    this.setHealthData = this._setHealthData.bind(this);
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
    k8sGet(InfrastructureModel, 'cluster').then(model => { // TODO: move to WithResources
      const provider = _.get(model, 'status.platform');
      this.setState({
        detailsData: {
          loaded: true,
          data: {
            provider,
          },
        },
      });
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          detailsData: this.state.detailsData,
          inventoryData: getInventoryData(resources), // k8s object loaded via WithResources
          healthData: this.state.healthData,

          complianceData, // TODO: mock, replace by real data and remove from web-ui-components
          capacityStats, // TODO: mock, replace by real data and remove from web-ui-components
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
      <WithResources resourceMap={inventoryResourceMap} resourceToProps={inventoryResourceMapToProps}>
        <ClusterOverviewContext.Provider>
          <KubevirtClusterOverview />
        </ClusterOverviewContext.Provider>
      </WithResources>
    );
  }
}
