import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
  TopologyCreateConnector,
  TopologyDecoratorProvider,
} from '@console/topology/src/extensions';
import {
  FLAG_CAMEL_KAMELETS,
  FLAG_KNATIVE_EVENTING,
  FLAG_KNATIVE_SERVING,
  FLAG_KNATIVE_SERVING_CONFIGURATION,
  FLAG_KNATIVE_SERVING_REVISION,
  FLAG_KNATIVE_SERVING_ROUTE,
  FLAG_KNATIVE_SERVING_SERVICE,
} from '../const';
import {
  getKnativeEventingKameletsResources,
  getKnativeEventingResources,
  getKnativeServingResources,
} from '../utils/get-knative-resources';

const getKnativeServingTopologyDataModel = () =>
  import('./data-transformer' /* webpackChunkName: "serving-components" */).then(
    (m) => m.getKnativeServingTopologyDataModel,
  );

const getKnativeEventingTopologyDataModel = () =>
  import('./data-transformer' /* webpackChunkName: "eventing-components" */).then(
    (m) => m.getKnativeEventingTopologyDataModel,
  );

const getKnativeKameletsTopologyDataModel = () =>
  import('./data-transformer' /* webpackChunkName: "kamelets-components" */).then(
    (m) => m.getKnativeKameletsTopologyDataModel,
  );

const getIsKnativeResource = () =>
  import('./isKnativeResource' /* webpackChunkName: "knative-components" */).then(
    (m) => m.isKnativeResource,
  );

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyDisplayFilters
  | TopologyCreateConnector
  | TopologyDecoratorProvider;

export const topologyPlugin: Plugin<TopologyConsumedExtensions> = [
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'knative-serving-topology-model-factory',
      priority: 100,
      resources: getKnativeServingResources,
      workloadKeys: ['ksservices'],
      getDataModel: applyCodeRefSymbol(getKnativeServingTopologyDataModel),
      isResourceDepicted: applyCodeRefSymbol(getIsKnativeResource),
    },
    flags: {
      required: [
        FLAG_KNATIVE_SERVING_CONFIGURATION,
        FLAG_KNATIVE_SERVING,
        FLAG_KNATIVE_SERVING_REVISION,
        FLAG_KNATIVE_SERVING_ROUTE,
        FLAG_KNATIVE_SERVING_SERVICE,
      ],
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'knative-eventing-topology-model-factory',
      priority: 100,
      resources: getKnativeEventingResources,
      workloadKeys: ['eventingsubscription'],
      getDataModel: applyCodeRefSymbol(getKnativeEventingTopologyDataModel),
      isResourceDepicted: applyCodeRefSymbol(getIsKnativeResource),
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'knative-kamelets-topology-model-factory',
      priority: 100,
      resources: getKnativeEventingKameletsResources,
      workloadKeys: ['kameletbindings'],
      getDataModel: applyCodeRefSymbol(getKnativeKameletsTopologyDataModel),
      isResourceDepicted: applyCodeRefSymbol(getIsKnativeResource),
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING, FLAG_CAMEL_KAMELETS],
    },
  },
];
