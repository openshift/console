import React from 'react';
import * as _ from 'lodash-es';
import {
  ClusterOverview as KubevirtClusterOverview,
  detailsData,
  complianceData,
  utilizationStats,
  capacityStats,
  getResource,
} from 'kubevirt-web-ui-components';

import { NodeModel, PodModel, PersistentVolumeClaimModel, VirtualMachineModel, InfrastructureModel } from '../../../models';
import { LoadingInline } from '../utils/okdutils';
import { WithResources } from '../utils/withResources';
import { k8sBasePath, k8sGet } from '../..//module/okdk8s';
import { coFetch, coFetchJSON } from '../../../co-fetch';

import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from './events-inner-overview';

const CONSUMERS_CPU_QUERY = 'sort(topk(10, sum by (pod_name)(container_cpu_usage_seconds_total{pod_name!=""})))';
const CONSUMERS_MEMORY_QUERY = 'sort(topk(10, sum by (pod_name)(container_memory_usage_bytes{pod_name!=""})))';

const mockedData = {
  detailsData,
  complianceData,
  utilizationStats,
  capacityStats,
};

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

const inventoryResourceMapToProps = resources => {
  const props = {};

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
  props.inventoryData = {
    inventory,
    loaded: !!inventory,
  };
  return props;
};

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
    this.OverviewEventStream = () => <EventStream InnerComponent={EventsInnerOverview} overview={true} />;
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
    k8sGet(InfrastructureModel, 'cluster').then(model => {
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
    return (
      <WithResources resourceMap={inventoryResourceMap} resourceToProps={inventoryResourceMapToProps}>
        <KubevirtClusterOverview
          {...mockedData}
          consumersData={this.state.consumersData}
          eventsData={{Component: this.OverviewEventStream, loaded: true}}
          inventoryData={{loaded: false}}
          healthData={this.state.healthData}
          LoadingComponent={LoadingInline}
          detailsData={this.state.detailsData} />
      </WithResources>
    );
  }
}
