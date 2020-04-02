import { referenceForModel } from '@console/internal/module/k8s';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  KebabActions,
  ResourceListPage,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthResourceSubsystem,
  RoutePage,
  ResourceDetailsPage,
  ResourceNSNavItem,
} from '@console/plugin-sdk';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { ImageManifestVulnModel } from './models';
import { SecurityLabellerFlag } from './const';
import { securityHealthHandler } from './components/summary';
import { getKebabActionsForKind } from './kebab-actions';
import { WatchImageVuln } from './types';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewHealthResourceSubsystem<WatchImageVuln>
  | RoutePage
  | KebabActions
  | ResourceNSNavItem;

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
      flag: SecurityLabellerFlag,
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
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
        ImageManifestVulnModel,
      )}/:name`,
      loader: () =>
        import(
          './components/image-manifest-vuln' /* webpackChunkName: "container-security" */
        ).then((m) => m.ImageManifestVulnDetailsPage),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: `/k8s/ns/:ns/${referenceForModel(
        ClusterServiceVersionModel,
      )}/:appName/${referenceForModel(ImageManifestVulnModel)}/:name`,
      loader: () =>
        import(
          './components/image-manifest-vuln' /* webpackChunkName: "container-security" */
        ).then((m) => m.ImageManifestVulnDetailsPage),
    },
  },
  {
    type: 'Dashboards/Overview/Health/Resource',
    properties: {
      title: 'Quay Image Security',
      resources: {
        imageManifestVuln: {
          kind: referenceForModel(ImageManifestVulnModel),
          namespaced: true,
          isList: true,
        },
      },
      healthHandler: securityHealthHandler,
      popupTitle: 'Quay Image Security breakdown',
      popupComponent: () =>
        import('./components/summary' /* webpackChunkName: "container-security" */).then(
          (m) => m.SecurityBreakdownPopup,
        ),
    },
    flags: {
      required: [SecurityLabellerFlag],
    },
  },
  {
    type: 'KebabActions',
    properties: {
      getKebabActionsForKind,
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'admin',
      section: 'Administration',
      mergeBefore: 'Custom Resource Definitions',
      componentProps: {
        name: 'Image Manifest Vulnerabilities',
        resource: referenceForModel(ImageManifestVulnModel),
        testID: 'imagemanifestvuln-header',
      },
    },
    flags: {
      required: [SecurityLabellerFlag],
    },
  },
];

export default plugin;
