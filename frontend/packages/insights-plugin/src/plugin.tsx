import {
  Plugin,
  DashboardsOverviewHealthResourceSubsystem,
  ModelFeatureFlag,
} from '@console/plugin-sdk';
import { ClusterVersionModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { getClusterInsightsStatus } from './components/InsightsPopup/status';
import * as models from './models';

type ConsumedExtensions = DashboardsOverviewHealthResourceSubsystem<any> | ModelFeatureFlag;

const FLAG_INSIGHTS = 'INSIGHTS';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.InsightsModel,
      flag: FLAG_INSIGHTS,
    },
  },
  {
    type: 'Dashboards/Overview/Health/Resource',
    properties: {
      title: 'Insights',
      resources: {
        insightsReport: {
          kind: referenceForModel(models.InsightsModel),
          namespaced: false,
          name: 'report-overview-object',
          isList: false,
        },
        clusterVersion: {
          kind: referenceForModel(ClusterVersionModel),
          namespaced: false,
          name: 'version',
          isList: false,
        },
      },
      healthHandler: getClusterInsightsStatus,
      popupTitle: 'Insights Status',
      popupComponent: () =>
        import('./components/InsightsPopup/index' /* webpackChunkName: "insights-plugin" */).then(
          (m) => m.InsightsPopup,
        ),
    },
    flags: {
      required: [FLAG_INSIGHTS],
    },
  },
];

export default plugin;
