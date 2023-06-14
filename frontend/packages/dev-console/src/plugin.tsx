import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import {
  Plugin,
  ModelFeatureFlag,
  KebabActions,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  OverviewResourceTab,
  OverviewTabSection,
  GuidedTour,
  PostFormSubmissionAction,
  CustomFeatureFlag,
} from '@console/plugin-sdk';
import { ALLOW_SERVICE_BINDING_FLAG } from '@console/service-binding-plugin/src/const';
import { TopologyDataModelFactory } from '@console/topology/src/extensions';
import { doConnectsToBinding } from '@console/topology/src/utils/connector-utils';
import { getGuidedTour } from './components/guided-tour';
import { getBindableServiceResources } from './components/topology/bindable-services/bindable-service-resources';
import { INCONTEXT_ACTIONS_CONNECTS_TO } from './const';

const getBindableServicesTopologyDataModel = () =>
  import(
    './components/topology/bindable-services/data-transformer' /* webpackChunkName: "topology-bindable-services" */
  ).then((m) => m.getBindableServicesTopologyDataModel);

const isServiceBindable = () =>
  import(
    './components/topology/bindable-services/isBindable' /* webpackChunkName: "topology-bindable-services" */
  ).then((m) => m.isServiceBindable);

type ConsumedExtensions =
  | ModelFeatureFlag
  | CustomFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
  | KebabActions
  | OverviewResourceTab
  | OverviewTabSection
  | GuidedTour
  | PostFormSubmissionAction
  | TopologyDataModelFactory;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Overview/Resource',
    properties: {
      // t('devconsole~Observe')
      name: '%devconsole~Observe%',
      key: 'isMonitorable',
      loader: () =>
        import(
          './components/monitoring/overview/MonitoringTab' /* webpackChunkName: "monitoring-overview" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'GuidedTour',
    properties: {
      perspective: 'dev',
      tour: getGuidedTour(),
    },
  },
  {
    type: 'PostFormSubmissionAction',
    properties: {
      type: INCONTEXT_ACTIONS_CONNECTS_TO,
      callback: doConnectsToBinding,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'bindable-service-topology-model-factory',
      priority: 100,
      resources: getBindableServiceResources,
      getDataModel: applyCodeRefSymbol(getBindableServicesTopologyDataModel),
      isResourceDepicted: applyCodeRefSymbol(isServiceBindable),
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG],
    },
  },
];

export default plugin;
