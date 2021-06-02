import { NamespaceModel, PodModel, ProjectModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  ResourceListPage,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthResourceSubsystem,
  RoutePage,
  ResourceDetailsPage,
  HorizontalNavTab,
} from '@console/plugin-sdk';
import { securityHealthHandler } from './components/summary';
import { ContainerSecurityFlag } from './const';
import { ImageManifestVulnModel } from './models';
import { WatchImageVuln } from './types';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewHealthResourceSubsystem<WatchImageVuln>
  | RoutePage
  | HorizontalNavTab;

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
      title: 'Image Vulnerabilities',
      resources: {
        imageManifestVuln: {
          kind: referenceForModel(ImageManifestVulnModel),
          namespaced: true,
          isList: true,
        },
      },
      healthHandler: securityHealthHandler,
      popupTitle: 'Image Vulnerabilities breakdown',
      popupComponent: () =>
        import('./components/summary' /* webpackChunkName: "container-security" */).then(
          (m) => m.SecurityBreakdownPopup,
        ),
    },
    flags: {
      required: [ContainerSecurityFlag],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: PodModel,
      page: {
        name: 'Vulnerabilities',
        href: 'vulnerabilities',
      },
      loader: () =>
        import(
          './components/image-manifest-vuln' /* webpackChunkName: "container-security" */
        ).then((m) => m.ImageManifestVulnPodTab),
    },
    flags: {
      required: [ContainerSecurityFlag],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: ProjectModel,
      page: {
        name: 'Vulnerabilities',
        href: 'vulnerabilities',
      },
      loader: () =>
        import(
          './components/image-manifest-vuln' /* webpackChunkName: "project-image-vuln-list" */
        ).then((m) => m.ProjectImageManifestVulnListPage),
    },
    flags: {
      required: [ContainerSecurityFlag],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: NamespaceModel,
      page: {
        name: 'Vulnerabilities',
        href: 'vulnerabilities',
      },
      loader: () =>
        import(
          './components/image-manifest-vuln' /* webpackChunkName: "project-image-vuln-list" */
        ).then((m) => m.ProjectImageManifestVulnListPage),
    },
    flags: {
      required: [ContainerSecurityFlag],
    },
  },
];

export default plugin;
