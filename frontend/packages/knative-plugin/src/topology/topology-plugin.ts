import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
  TopologyCreateConnector,
} from '@console/dev-console/src/extensions/topology';

import {
  getIsKnativeResource,
  getKnativeComponentFactory,
  getKnativeTopologyDataModel,
  getTopologyFilters,
  applyDisplayOptions,
  getCreateConnector,
} from './index';
import {
  FLAG_KNATIVE_EVENTING,
  FLAG_KNATIVE_SERVING,
  FLAG_KNATIVE_SERVING_CONFIGURATION,
  FLAG_KNATIVE_SERVING_REVISION,
  FLAG_KNATIVE_SERVING_ROUTE,
  FLAG_KNATIVE_SERVING_SERVICE,
} from '../const';
import {
  knativeServingResourcesConfigurationsWatchers,
  knativeServingResourcesRevisionWatchers,
  knativeServingResourcesRoutesWatchers,
  knativeServingResourcesServicesWatchers,
  knativeEventingResourcesSubscriptionWatchers,
  knativeEventingBrokerResourceWatchers,
  knativeEventingTriggerResourceWatchers,
  knativeCamelIntegrationsResourceWatchers,
} from '../utils/get-knative-resources';
import {
  getDynamicEventSourcesWatchers,
  getDynamicEventingChannelWatchers,
  fetchEventSourcesCrd,
  fetchChannelsCrd,
} from '../utils/fetch-dynamic-eventsources-utils';

// Added it to perform discovery of Dynamic event sources on cluster on app load as kebab option needed models upfront
fetchEventSourcesCrd();
fetchChannelsCrd();

export const getKnativeResources = (namespace: string) => {
  return {
    ...knativeServingResourcesRevisionWatchers(namespace),
    ...knativeServingResourcesConfigurationsWatchers(namespace),
    ...knativeServingResourcesRoutesWatchers(namespace),
    ...knativeServingResourcesServicesWatchers(namespace),
    ...knativeEventingResourcesSubscriptionWatchers(namespace),
    ...getDynamicEventSourcesWatchers(namespace),
    ...getDynamicEventingChannelWatchers(namespace),
    ...knativeEventingBrokerResourceWatchers(namespace),
    ...knativeEventingTriggerResourceWatchers(namespace),
    ...knativeCamelIntegrationsResourceWatchers(namespace),
  };
};

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyDisplayFilters
  | TopologyCreateConnector;

export const topologyPlugin: Plugin<TopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: getKnativeComponentFactory,
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
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'knative-topology-model-factory',
      priority: 100,
      resources: getKnativeResources,
      workloadKeys: ['ksservices'],
      getDataModel: getKnativeTopologyDataModel,
      isResourceDepicted: getIsKnativeResource,
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
  {
    type: 'Topology/DisplayFilters',
    properties: {
      getTopologyFilters,
      applyDisplayOptions,
    },
  },
  {
    type: 'Topology/CreateConnector',
    properties: {
      getCreateConnector,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
];
