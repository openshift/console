import * as _ from 'lodash';
import * as models from './models';
import {
  ClusterServiceVersionAction,
  DashboardsCard,
  DashboardsOverviewHealthResourceSubsystem,
  DashboardsOverviewUtilizationItem,
  DashboardsTab,
  KebabActions,
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
  ResourceTabPage,
  RoutePage,
  ResourceDetailsPage,
  DashboardsOverviewResourceActivity,
  CustomFeatureFlag,
} from '@console/plugin-sdk';
import {
  detectOCS,
  detectOCSSupportedFeatures,
  CEPH_FLAG,
  OCS_INDEPENDENT_FLAG,
  OCS_SUPPORT_FLAGS,
  OCS_CONVERGED_FLAG,
} from './features';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { GridPosition } from '@console/shared/src/components/dashboard/DashboardGrid';
import { referenceForModel, referenceFor } from '@console/internal/module/k8s';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { getCephHealthState } from './components/dashboard-page/storage-dashboard/status-card/utils';
import { isClusterExpandActivity } from './components/dashboard-page/storage-dashboard/activity-card/cluster-expand-activity';
import { WatchCephResource } from './types';

type ConsumedExtensions =
  | ModelFeatureFlag
  | ModelDefinition
  | DashboardsTab
  | DashboardsCard
  | DashboardsOverviewHealthResourceSubsystem<WatchCephResource>
  | DashboardsOverviewUtilizationItem
  | RoutePage
  | CustomFeatureFlag
  | ClusterServiceVersionAction
  | KebabActions
  | ResourceDetailsPage
  | ResourceTabPage
  | ClusterServiceVersionAction
  | KebabActions
  | DashboardsOverviewResourceActivity;

const apiObjectRef = referenceForModel(models.OCSServiceModel);

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.OCSServiceModel,
      flag: CEPH_FLAG,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectOCSSupportedFeatures,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectOCS,
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'volumesnapshots',
      model: PersistentVolumeClaimModel,
      name: 'Volume Snapshots',
      loader: () =>
        import('./components/volume-snapshot/volume-snapshot').then(
          (m) => m.VolumeSnapshotPage,
        ) /* webpackChunkName: "ceph-storage-volume-snapshot" */,
    },
    flags: {
      required: [OCS_SUPPORT_FLAGS.SNAPSHOT, CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'persistent-storage',
      title: 'Persistent Storage',
    },
    flags: {
      required: [OCS_CONVERGED_FLAG],
      disallowed: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${apiObjectRef}/~new`,
      loader: () =>
        import('./components/ocs-install/install-page' /* webpackChunkName: "install-page" */).then(
          (m) => m.default,
        ),
    },
  },
  // Ceph Storage Dashboard Left cards
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/details-card' /* webpackChunkName: "ceph-storage-details-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/inventory-card' /* webpackChunkName: "ceph-storage-inventory-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  // Ceph Storage Dashboard Main Cards
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/status-card/status-card' /* webpackChunkName: "ceph-storage-status-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/capacity-breakdown/capacity-breakdown-card' /* webpackChunkName: "ceph-storage-usage-breakdown-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/utilization-card/utilization-card' /* webpackChunkName: "ceph-storage-utilization-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  // Ceph Storage Dashboard Right Cards
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/activity-card/activity-card' /* webpackChunkName: "ceph-storage-activity-card" */
        ).then((m) => m.ActivityCard),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Health/Resource',
    properties: {
      title: 'Storage',
      resources: {
        ceph: {
          kind: referenceForModel(models.CephClusterModel),
          namespaced: false,
          isList: true,
        },
      },
      healthHandler: getCephHealthState,
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      kind: 'StorageCluster',
      label: 'Add Capacity',
      apiGroup: models.OCSServiceModel.apiGroup,
      callback: (kind, ocsConfig) => () => {
        const clusterObject = { ocsConfig };
        import(
          './components/modals/add-capacity-modal/add-capacity-modal' /* webpackChunkName: "ceph-storage-add-capacity-modal" */
        )
          .then((m) => m.addCapacityModal(clusterObject))
          .catch((e) => {
            throw e;
          });
      },
    },
    flags: {
      disallowed: [OCS_INDEPENDENT_FLAG],
    },
  },
  // Download External Cluster Metadata
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      kind: 'StorageCluster',
      label: 'Download Cluster Metadata',
      apiGroup: models.OCSServiceModel.apiGroup,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      callback: (_kind, _obj) => () =>
        import(
          './components/converged-credentials/credentials' /* webpackChunkName: "ceph-storage-export-credentials" */
        ).then((m) => m.default({})),
    },
    flags: {
      disallowed: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'independent-dashboard',
      title: 'Persistent Storage',
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  // Left Cards
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/independent-dashboard-page/details-card/card' /* webpackChunkName: "indepedent-details-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/inventory-card' /* webpackChunkName: "ceph-storage-inventory-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  // Center
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/independent-dashboard-page/status-card/card' /* webpackChunkName: "indepedent-status-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/independent-dashboard-page/breakdown-card/card' /* webpackChunkName: "independent-breakdown-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/independent-dashboard-page/utilization-card/card' /* webpackChunkName: "utilization-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  // Right
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/activity-card/activity-card' /* webpackChunkName: "ceph-storage-activity-card" */
        ).then((m) => m.ActivityCard),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.VolumeSnapshotModel,
      loader: async () =>
        import(
          './components/volume-snapshot/volume-snapshot' /* webpackChunkName: "ceph-storage-volume-snapshot-details" */
        ).then((m) => m.VolumeSnapshotDetails),
      modelParser: referenceFor,
    },
    flags: {
      required: [OCS_SUPPORT_FLAGS.SNAPSHOT, CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        kind: referenceForModel(models.OCSServiceModel),
        namespaced: false,
        prop: 'storage-cluster',
      },
      isActivity: isClusterExpandActivity,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/activity-card/cluster-expand-activity' /* webpackChunkName: "ceph-storage-plugin" */
        ).then((m) => m.ClusterExpandActivity),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
];

export default plugin;
