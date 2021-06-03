import { Plugin, DashboardsOverviewHealthPrometheusSubsystem } from '@console/plugin-sdk';
import { ClusterVersionModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { getClusterInsightsStatus } from './components/InsightsPopup/status';

type ConsumedExtensions = DashboardsOverviewHealthPrometheusSubsystem;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Dashboards/Overview/Health/Prometheus',
    properties: {
      // t('insights-plugin~Insights')
      title: '%insights-plugin~Insights%',
      queries: [
        "health_statuses_insights{metric=~'low|moderate|important|critical'}",
        'insightsclient_request_send_total',
      ],
      healthHandler: getClusterInsightsStatus,
      additionalResource: {
        kind: referenceForModel(ClusterVersionModel),
        namespaced: false,
        name: 'version',
        isList: false,
        prop: 'cluster',
      },
      popupComponent: () =>
        import('./components/InsightsPopup/index' /* webpackChunkName: "insights-plugin" */).then(
          (m) => m.InsightsPopup,
        ),
      // t('insights-plugin~Insights Advisor status')
      popupTitle: '%insights-plugin~Insights Advisor status%',
    },
  },
];

export default plugin;
