import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  ResourceListPage,
  ResourceDetailsPage,
} from '@console/plugin-sdk';
import { ContainerSecurityFlag } from './const';
import { ImageManifestVulnModel } from './models';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage;

const plugin: Plugin<ConsumedExtensions> = [
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
      flag: ContainerSecurityFlag,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: ImageManifestVulnModel,
      loader: async () =>
        (
          await import(
            './components/image-manifest-vuln' /* webpack-chunk-name: "container-security" */
          )
        ).ImageManifestVulnPage,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: ImageManifestVulnModel,
      loader: () =>
        import(
          './components/image-manifest-vuln' /* webpackChunkName: "container-security" */
        ).then((m) => m.ImageManifestVulnDetailsPage),
    },
  },
];

export default plugin;
