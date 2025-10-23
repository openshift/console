import * as _ from 'lodash';
import {
  ClusterVersionModel,
  NodeModel,
  PodModel,
  StorageClassModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotContentModel,
  ConsoleOperatorConfigModel,
  ConsolePluginModel,
} from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  Plugin,
  ModelDefinition,
  RoutePage,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewInventoryItem,
  ResourceDetailsPage,
  ResourceListPage,
  ResourceTabPage,
  GuidedTour,
} from '@console/plugin-sdk';
import { FLAGS } from '@console/shared/src/constants';
import '@console/internal/i18n.js';
import {
  getClusterUpdateTimestamp,
  isClusterUpdateActivity,
} from './components/dashboards-page/activity';
import { getGuidedTour } from './components/guided-tour';
import { USER_PREFERENCES_BASE_URL } from './components/user-preferences/const';
import * as models from './models';

type ConsumedExtensions =
  | ModelDefinition
  | RoutePage
  | DashboardsOverviewResourceActivity
  | DashboardsOverviewInventoryItem
  | GuidedTour
  | ResourceListPage
  | ResourceDetailsPage
  | ResourceTabPage;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        prop: 'clusterVersion',
        kind: referenceForModel(ClusterVersionModel),
        namespaced: false,
      },
      isActivity: isClusterUpdateActivity,
      getTimestamp: getClusterUpdateTimestamp,
      loader: () =>
        import(
          './components/dashboards-page/ClusterUpdateActivity' /* webpackChunkName: "console-app" */
        ).then((m) => m.default),
    },
    flags: {
      required: [FLAGS.CLUSTER_VERSION],
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: NodeModel,
      mapper: () =>
        import(
          '@console/shared/src/components/dashboard/inventory-card/utils' /* webpackChunkName: "console-app" */
        ).then((m) => m.getNodeStatusGroups),
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: PodModel,
      mapper: () =>
        import(
          '@console/shared/src/components/dashboard/inventory-card/utils' /* webpackChunkName: "console-app" */
        ).then((m) => m.getPodStatusGroups),
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: StorageClassModel,
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: PersistentVolumeClaimModel,
      mapper: () =>
        import(
          '@console/shared/src/components/dashboard/inventory-card/utils' /* webpackChunkName: "console-app" */
        ).then((m) => m.getPVCStatusGroups),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/quickstart/'],
      loader: async () =>
        (
          await import(
            './components/quick-starts/QuickStartCatalogPageAsync' /* webpackChunkName: "quick-start" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: VolumeSnapshotContentModel,
      loader: () =>
        import(
          './components/volume-snapshot/volume-snapshot-content' /* webpackChunkName: "volume-snapshot-content-page" */
        ).then((m) => m.default),
    },
    flags: {
      required: [FLAGS.CAN_LIST_VSC],
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: VolumeSnapshotContentModel,
      loader: () =>
        import(
          './components/volume-snapshot/volume-snapshot-content-details' /* webpackChunkName: "volume-snapshot-content-details-page" */
        ).then((m) => m.default),
    },
    flags: {
      required: [FLAGS.CAN_LIST_VSC],
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'volumesnapshots',
      model: PersistentVolumeClaimModel,
      // t('console-app~VolumeSnapshots')
      name: '%console-app~VolumeSnapshots%',
      loader: () =>
        import(
          './components/volume-snapshot/volume-snapshot' /* webpackChunkName: "volume-snapshot-page" */
        ).then((m) => m.VolumeSnapshotPVCPage),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: ConsoleOperatorConfigModel,
      loader: async () =>
        (
          await import(
            './components/console-operator/ConsoleOperatorConfig' /* webpackChunkName: "console-operator-config" */
          )
        ).ConsoleOperatorConfigDetailsPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [USER_PREFERENCES_BASE_URL, `${USER_PREFERENCES_BASE_URL}/:group`],
      loader: async () =>
        (
          await import(
            './components/user-preferences/UserPreferencePage' /* webpackChunkName: "co-user-preference" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'plugin-manifest',
      model: ConsolePluginModel,
      // t('console-app~Plugin manifest')
      name: '%console-app~Plugin manifest%',
      loader: () =>
        import(
          './components/console-operator/ConsolePluginManifestPage' /* webpackChunkName: "console-operator-config" */
        ).then((m) => m.ConsolePluginManifestPage),
    },
  },
  {
    type: 'GuidedTour',
    properties: {
      perspective: 'admin',
      tour: getGuidedTour(),
    },
  },
];

export default plugin;
