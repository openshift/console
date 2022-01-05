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
  FLAG_KNATIVE_EVENTING,
  FLAG_KNATIVE_SERVING,
  FLAG_KNATIVE_SERVING_CONFIGURATION,
  FLAG_KNATIVE_SERVING_REVISION,
  FLAG_KNATIVE_SERVING_ROUTE,
  FLAG_KNATIVE_SERVING_SERVICE,
} from '../const';
import { fetchEventSourcesCrd, fetchChannelsCrd } from '../utils/fetch-dynamic-eventsources-utils';
import { getKnativeResources } from '../utils/get-knative-resources';

// Added it to perform discovery of Dynamic event sources on cluster on app load as kebab option needed models upfront
// TODO: Remove this toplevel api calls which are triggered as soon as this file is loaded.
fetchEventSourcesCrd().catch((err) => {
  // eslint-disable-next-line no-console
  console.warn('Error fetching CRDs for dynamic event sources', err);
});
fetchChannelsCrd().catch((err) => {
  // eslint-disable-next-line no-console
  console.warn('Error fetching CRDs for dynamic channel model refs', err);
});

const getKnativeTopologyDataModel = () =>
  import('./data-transformer' /* webpackChunkName: "knative-components" */).then(
    (m) => m.getKnativeTopologyDataModel,
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
      id: 'knative-topology-model-factory',
      priority: 100,
      resources: getKnativeResources,
      workloadKeys: ['ksservices'],
      getDataModel: applyCodeRefSymbol(getKnativeTopologyDataModel),
      isResourceDepicted: applyCodeRefSymbol(getIsKnativeResource),
    },
    flags: {
      required: [
        FLAG_KNATIVE_SERVING_CONFIGURATION,
        FLAG_KNATIVE_SERVING,
        FLAG_KNATIVE_SERVING_REVISION,
        FLAG_KNATIVE_SERVING_ROUTE,
        FLAG_KNATIVE_SERVING_SERVICE,
        FLAG_KNATIVE_EVENTING,
      ],
    },
  },
];
