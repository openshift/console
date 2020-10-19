import { Plugin, DashboardsOverviewHealthPrometheusSubsystem } from '@console/plugin-sdk';
import { ClusterVersionModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { getClusterInsightsStatus } from './components/InsightsPopup/status';

type ConsumedExtensions = DashboardsOverviewHealthPrometheusSubsystem;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Dashboards/Overview/Health/Prometheus',
    properties: {
      title: 'Insights',
      queries: ["health_statuses_insights{metric=~'low|moderate|important|critical'}"],
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
      popupTitle: 'Insights status',
    },
  },
];

export default plugin;
