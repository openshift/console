import { referenceForModel } from '@console/internal/module/k8s';
import { Plugin, ModelDefinition, ModelFeatureFlag } from '@console/plugin-sdk';
import { ImageManifestVulnModel } from './models';
import { SecurityLabellerFlag } from './const';
import { securityHealthHandler } from './components/summary';

type ConsumedExtensions = ModelDefinition | ModelFeatureFlag;

export default [
  {
    type: 'ModelDefinition',
    properties: {
      models: [ImageManifestVulnModel],
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: ImageManifestVulnModel,
      flag: SecurityLabellerFlag,
    },
  },
  {
    type: 'Dashboards/Overview/Health/URL',
    properties: {
      title: 'Quay Image Security',
      url: '',
      fetch: () => null,
      healthHandler: securityHealthHandler,
      additionalResource: {
        kind: referenceForModel(ImageManifestVulnModel),
        namespaced: true,
        isList: true,
        prop: 'imageManifestVuln',
      },
      popupComponent: () =>
        import('./components/summary' /* webpackChunkName: "container-security" */).then(
          (m) => m.SecurityBreakdownPopup,
        ),
      popupTitle: 'Quay Image Security breakdown',
      required: SecurityLabellerFlag,
    },
  },
] as Plugin<ConsumedExtensions>;
