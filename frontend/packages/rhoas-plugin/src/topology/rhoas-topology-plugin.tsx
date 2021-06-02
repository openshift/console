import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { Plugin } from '@console/plugin-sdk';
import { ALLOW_SERVICE_BINDING_FLAG } from '@console/topology/src/const';
import {
  TopologyComponentFactory,
  TopologyCreateConnector,
  TopologyDataModelFactory,
} from '@console/topology/src/extensions/topology';
import { FLAG_RHOAS } from '../const';
import { KafkaConnectionModel } from '../models';
import { getRhoasComponentFactory, getRhoasTopologyDataModel } from './index';

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyCreateConnector;

const getRhoasWatchedResources = (
  namespace: string,
): WatchK8sResources<{ kafkaConnections: K8sResourceKind[] }> => {
  return {
    kafkaConnections: {
      isList: true,
      kind: referenceForModel(KafkaConnectionModel),
      namespace,
      optional: true,
    },
  };
};

export const rhoasTopologyPlugin: Plugin<TopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: getRhoasComponentFactory,
    },
    flags: {
      required: [FLAG_RHOAS],
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'rhoas-topology-model-factory',
      priority: 400,
      getDataModel: getRhoasTopologyDataModel,
      resources: getRhoasWatchedResources,
      workloadKeys: ['kafkaConnections'],
    },
    flags: {
      required: [FLAG_RHOAS],
    },
  },
  {
    type: 'Topology/CreateConnector',
    properties: {
      getCreateConnector: applyCodeRefSymbol(() =>
        import('./createConnector' /* webpackChunkName: "rhoas-create-connector" */).then(
          (m) => m.getCreateConnector,
        ),
      ),
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG, FLAG_RHOAS],
    },
  },
];
