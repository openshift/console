import * as _ from 'lodash';
import * as models from './models';
import {
  AlertAction,
  ClusterServiceVersionAction,
  DashboardsCard,
  DashboardsOverviewHealthResourceSubsystem,
  DashboardsOverviewUtilizationItem,
  DashboardsTab,
  HorizontalNavTab,
  KebabActions,
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
  ResourceTabPage,
  RoutePage,
  ResourceDetailsPage,
  DashboardsOverviewResourceActivity,
  CustomFeatureFlag,
  StorageClassProvisioner,
} from '@console/plugin-sdk';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { GridPosition } from '@console/shared/src/components/dashboard/DashboardGrid';
import { referenceForModel } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { LSO_DEVICE_DISCOVERY } from '@console/local-storage-operator-plugin/src/plugin';
import { OCS_ATTACHED_DEVICES_FLAG } from '@console/local-storage-operator-plugin/src/features';
import { getCephHealthState } from './components/dashboard-page/storage-dashboard/status-card/utils';
import { isClusterExpandActivity } from './components/dashboard-page/storage-dashboard/activity-card/cluster-expand-activity';
import { StorageClassFormProvisoners } from './utils/ocs-storage-class-params';
import { WatchCephResource } from './types';
import {
  detectOCS,
  detectOCSSupportedFeatures,
  detectRGW,
  CEPH_FLAG,
  OCS_INDEPENDENT_FLAG,
  OCS_CONVERGED_FLAG,
  ODF_MANAGED_FLAG,
  detectManagedODF,
} from './features';
import { getAlertActionPath } from './utils/alert-action-path';
import { OSD_DOWN_ALERT, OSD_DOWN_AND_OUT_ALERT } from './constants';

type ConsumedExtensions =
  | AlertAction
  | ModelFeatureFlag
  | HorizontalNavTab
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
  | DashboardsOverviewResourceActivity
  | StorageClassProvisioner;

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
      detect: detectManagedODF,
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
  // Todo(bipuladh): Detect RGW to be run only when OCS Storage Cluster is created
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectRGW,
    },
  },
  {
    type: 'StorageClass/Provisioner',
    properties: {
      getStorageClassProvisioner: StorageClassFormProvisoners,
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'persistent-storage',
      // t('ceph-storage-plugin~Persistent Storage')
      title: '%ceph-storage-plugin~Persistent Storage%',
    },
    flags: {
      required: [OCS_CONVERGED_FLAG],
      disallowed: [OCS_INDEPENDENT_FLAG, ODF_MANAGED_FLAG],
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
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(
        ClusterServiceVersionModel,
      )}/:appName/${apiObjectRef}/~new`,
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
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/storage-efficiency-card/storage-efficiency-card' /* webpackChunkName: "ceph-storage-efficiency-card" */
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
          './components/dashboard-page/storage-dashboard/raw-capacity-card/raw-capacity-card' /* webpackChunkName: "raw-capacity-card" */
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
      // t('ceph-storage-plugin~Storage')
      title: '%ceph-storage-plugin~Storage%',
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
      // t('ceph-storage-plugin~Add Capacity')
      label: '%ceph-storage-plugin~Add Capacity%',
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
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'independent-dashboard',
      // t('ceph-storage-plugin~Persistent Storage')
      title: '%ceph-storage-plugin~Persistent Storage%',
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
      disallowed: [ODF_MANAGED_FLAG],
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
          './components/independent-dashboard-page/details-card' /* webpackChunkName: "indepedent-details-card" */
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
          './components/independent-dashboard-page/status-card' /* webpackChunkName: "indepedent-status-card" */
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
          './components/independent-dashboard-page/breakdown-card' /* webpackChunkName: "independent-breakdown-card" */
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
          './components/independent-dashboard-page/utilization-card' /* webpackChunkName: "utilization-card" */
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
  {
    type: 'HorizontalNavTab',
    properties: {
      model: NodeModel,
      page: {
        href: 'disks',
        // t('ceph-storage-plugin~Disks')
        name: '%ceph-storage-plugin~Disks%',
      },
      loader: () =>
        import(
          './components/attached-devices-mode/lso-disk-inventory/ocs-disks-list' /* webpackChunkName: "ocs-nodes-disks-list" */
        ).then((m) => m.OCSNodesDiskListPage),
    },
    flags: {
      required: [OCS_ATTACHED_DEVICES_FLAG, LSO_DEVICE_DISCOVERY],
    },
  },
  {
    type: 'AlertAction',
    properties: {
      alert: OSD_DOWN_ALERT,
      // t('ceph-storage-plugin~Troubleshoot')
      text: '%ceph-storage-plugin~Troubleshoot%',
      path: getAlertActionPath,
    },
    flags: {
      required: [LSO_DEVICE_DISCOVERY, OCS_ATTACHED_DEVICES_FLAG],
    },
  },
  {
    type: 'AlertAction',
    properties: {
      alert: OSD_DOWN_AND_OUT_ALERT,
      // t('ceph-storage-plugin~Troubleshoot')
      text: '%ceph-storage-plugin~Troubleshoot%',
      path: getAlertActionPath,
    },
    flags: {
      required: [LSO_DEVICE_DISCOVERY, OCS_ATTACHED_DEVICES_FLAG],
    },
  },
];

export default plugin;
