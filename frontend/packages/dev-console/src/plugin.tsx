import {
  Plugin,
  ModelFeatureFlag,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  OverviewResourceTab,
  OverviewTabSection,
  GuidedTour,
  PostFormSubmissionAction,
  CustomFeatureFlag,
} from '@console/plugin-sdk';
import { TopologyDataModelFactory } from '@console/topology/src/extensions';
import { doConnectsToBinding } from '@console/topology/src/utils/connector-utils';
import { getGuidedTour } from './components/guided-tour';
import { INCONTEXT_ACTIONS_CONNECTS_TO } from './const';

type ConsumedExtensions =
  | ModelFeatureFlag
  | CustomFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
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
];

export default plugin;
