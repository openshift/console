import * as _ from 'lodash';
import {
  ClusterServiceVersionAction,
  DashboardsCard,
  DashboardsOverviewHealthResourceSubsystem,
  DashboardsTab,
  HorizontalNavTab,
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
  ResourceTabPage,
  RoutePage,
  ResourceDetailsPage,
  DashboardsOverviewResourceActivity,
  CustomFeatureFlag,
  StorageClassProvisioner,
  ProjectDashboardInventoryItem,
  ResourceListPage,
} from '@console/plugin-sdk';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { GridPosition } from '@console/shared/src/components/dashboard/DashboardGrid';
import { referenceForModel } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { LSO_DEVICE_DISCOVERY } from '@console/local-storage-operator-plugin/src/plugin';
import { OCS_ATTACHED_DEVICES_FLAG } from '@console/local-storage-operator-plugin/src/features';
import * as models from './models';
import { getCephHealthState } from './components/dashboards/persistent-internal/status-card/utils';
import { isClusterExpandActivity } from './components/dashboards/persistent-internal/activity-card/cluster-expand-activity';
import { StorageClassFormProvisoners } from './utils/ocs-storage-class-params';
import { WatchCephResource } from './types';
import {
  detectOCS,
  detectOCSSupportedFeatures,
  detectRGW,
  CEPH_FLAG,
  OCS_INDEPENDENT_FLAG,
  OCS_CONVERGED_FLAG,
  MCG_FLAG,
  OCS_FLAG,
  detectComponents,
} from './features';
import { getObcStatusGroups } from './components/dashboards/object-service/buckets-card/utils';

type ConsumedExtensions =
  | ModelFeatureFlag
  | HorizontalNavTab
  | ModelDefinition
  | DashboardsTab
  | DashboardsCard
  | DashboardsOverviewHealthResourceSubsystem<WatchCephResource>
  | RoutePage
  | CustomFeatureFlag
  | ClusterServiceVersionAction
  | ResourceDetailsPage
  | ResourceTabPage
  | ClusterServiceVersionAction
  | DashboardsOverviewResourceActivity
  | StorageClassProvisioner
  | ProjectDashboardInventoryItem
  | ResourceListPage;

const apiObjectRef = referenceForModel(models.OCSServiceModel);
const blockPoolRef = referenceForModel(models.CephBlockPoolModel);

const OCS_MODEL_FLAG = 'OCS_MODEL';

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
      flag: OCS_MODEL_FLAG,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectOCSSupportedFeatures,
    },
    flags: {
      required: [OCS_MODEL_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectOCS,
    },
    flags: {
      required: [OCS_MODEL_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectRGW,
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectComponents,
    },
    flags: {
      required: [OCS_FLAG],
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
      navSection: 'storage',
      // t('ceph-storage-plugin~Block and File')
      title: '%ceph-storage-plugin~Block and File%',
    },
    flags: {
      required: [OCS_CONVERGED_FLAG, CEPH_FLAG],
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
          './components/dashboards/persistent-internal/details-card' /* webpackChunkName: "ceph-storage-details-card" */
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
          './components/dashboards/persistent-internal/inventory-card' /* webpackChunkName: "ceph-storage-inventory-card" */
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
          './components/dashboards/persistent-internal/storage-efficiency-card/storage-efficiency-card' /* webpackChunkName: "ceph-storage-efficiency-card" */
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
          './components/dashboards/persistent-internal/status-card/status-card' /* webpackChunkName: "ceph-storage-status-card" */
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
          './components/dashboards/persistent-internal/raw-capacity-card/raw-capacity-card' /* webpackChunkName: "raw-capacity-card" */
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
          './components/dashboards/persistent-internal/capacity-breakdown-card/capacity-breakdown-card' /* webpackChunkName: "ceph-storage-usage-breakdown-card" */
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
          './components/dashboards/persistent-internal/utilization-card/utilization-card' /* webpackChunkName: "ceph-storage-utilization-card" */
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
          './components/dashboards/persistent-internal/activity-card/activity-card' /* webpackChunkName: "ceph-storage-activity-card" */
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
      // t('ceph-storage-plugin~Storage')
      popupTitle: '%ceph-storage-plugin~Storage%',
      popupComponent: () => import('./components/storage-popover').then((m) => m.StoragePopover),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      id: 'add-capacity',
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
    type: 'ClusterServiceVersion/Action',
    properties: {
      id: 'edit',
      kind: models.CephBlockPoolModel.kind,
      label: '%ceph-storage-plugin~Edit BlockPool%',
      apiGroup: models.CephBlockPoolModel.apiGroup,
      callback: (kind, obj) => () => {
        const props = { kind, blockPoolConfig: obj };
        import(
          './components/modals/block-pool-modal/update-block-pool-modal' /* webpackChunkName: "ceph-storage-update-block-pool-modal" */
        )
          .then((m) => m.updateBlockPoolModal(props))
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error('Error loading block Pool Modal', e);
          });
      },
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'independent-dashboard',
      navSection: 'storage',
      // t('ceph-storage-plugin~Block and File')
      title: '%ceph-storage-plugin~Block and File%',
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG, CEPH_FLAG],
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
          './components/dashboards/persistent-external/details-card' /* webpackChunkName: "indepedent-details-card" */
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
          './components/dashboards/persistent-internal/inventory-card' /* webpackChunkName: "ceph-storage-inventory-card" */
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
          './components/dashboards/persistent-external/status-card' /* webpackChunkName: "indepedent-status-card" */
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
          './components/dashboards/persistent-external/breakdown-card' /* webpackChunkName: "independent-breakdown-card" */
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
          './components/dashboards/persistent-external/utilization-card' /* webpackChunkName: "utilization-card" */
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
          './components/dashboards/persistent-internal/activity-card/activity-card' /* webpackChunkName: "ceph-storage-activity-card" */
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
          './components/dashboards/persistent-internal/activity-card/cluster-expand-activity' /* webpackChunkName: "ceph-storage-plugin" */
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
          './components/disk-inventory/ocs-disks-list' /* webpackChunkName: "ocs-nodes-disks-list" */
        ).then((m) => m.OCSNodesDiskListPage),
    },
    flags: {
      required: [OCS_ATTACHED_DEVICES_FLAG, LSO_DEVICE_DISCOVERY],
    },
  },
  // Noobaa Related Plugins
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
        models.NooBaaBucketClassModel,
      )}/~new`,
      loader: () =>
        import('./components/bucket-class/create-bc' /* webpackChunkName: "create-bc" */).then(
          (m) => m.default,
        ),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [
        `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
          models.NooBaaBackingStoreModel,
        )}/~new`,
        `/k8s/ns/:ns/${referenceForModel(models.NooBaaBackingStoreModel)}/~new`,
      ],
      loader: () =>
        import(
          './components/create-backingstore-page/create-bs-page' /* webpackChunkName: "create-bs" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [
        `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
          models.NooBaaNamespaceStoreModel,
        )}/~new`,
        `/k8s/ns/:ns/${referenceForModel(models.NooBaaNamespaceStoreModel)}/~new`,
      ],
      loader: () =>
        import(
          './components/namespace-store/create-namespace-store' /* webpackChunkName: "create-namespace-store" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'object-service',
      navSection: 'storage',
      // t('ceph-storage-plugin~Object')
      title: '%ceph-storage-plugin~Object%',
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/object-service/status-card/status-card' /* webpackChunkName: "object-service-status-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/object-service/details-card/details-card' /* webpackChunkName: "object-service-details-card" */
        ).then((m) => m.DetailsCard),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/object-service/storage-efficiency-card/storage-efficiency-card' /* webpackChunkName: "object-service-storage-efficiency-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/object-service/buckets-card/buckets-card' /* webpackChunkName: "object-service-buckets-card" */
        ).then((m) => m.BucketsCard),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/object-service/capacity-breakdown/capacity-breakdown-card' /* webpackChunkName: "object-service-capacity-breakdown-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/object-service/data-consumption-card/data-consumption-card' /* webpackChunkName: "object-service-data-consumption-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboards/object-service/activity-card/activity-card' /* webpackChunkName: "object-service-activity-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/object-service/resource-providers-card/resource-providers-card' /* webpackChunkName: "object-service-resource-providers-card" */
        ).then((m) => m.ResourceProvidersCard),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/ocs-dashboards`,
      loader: () => import('./components/dashboards/ocs-dashboards').then((m) => m.DashboardsPage),
    },
    flags: {
      required: [OCS_FLAG],
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.NooBaaObjectBucketModel,
      loader: () =>
        import(
          './components/object-bucket-page/object-bucket' /* webpackChunkName: "object-bucket-page" */
        ).then((m) => m.ObjectBucketsPage),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.NooBaaObjectBucketModel,
      loader: () =>
        import(
          './components/object-bucket-page/object-bucket' /* webpackChunkName: "object-bucket-page" */
        ).then((m) => m.ObjectBucketDetailsPage),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.NooBaaObjectBucketClaimModel,
      loader: () =>
        import(
          './components/object-bucket-claim-page/object-bucket-claim' /* webpackChunkName: "object-bucket-claim-page" */
        ).then((m) => m.ObjectBucketClaimsPage),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.NooBaaObjectBucketClaimModel,
      loader: () =>
        import(
          './components/object-bucket-claim-page/object-bucket-claim' /* webpackChunkName: "object-bucket-claim-page" */
        ).then((m) => m.ObjectBucketClaimsDetailsPage),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/k8s/ns/:ns/${referenceForModel(models.NooBaaObjectBucketClaimModel)}/~new/form`,
      loader: () =>
        import(
          './components/object-bucket-claim-page/create-obc' /* webpackChunkName: "create-obc" */
        ).then((m) => m.CreateOBCPage),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Project/Dashboard/Inventory/Item',
    properties: {
      model: models.NooBaaObjectBucketClaimModel,
      mapper: getObcStatusGroups,
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      id: 'edit-bucket-class-resources',
      kind: models.NooBaaBucketClassModel.kind,
      // t('ceph-storage-plugin~Edit Bucket Class Resources')
      label: '%ceph-storage-plugin~Edit Bucket Class Resources%',
      apiGroup: models.NooBaaBucketClassModel.apiGroup,
      callback: (kind, obj) => () =>
        import('./components/bucket-class/modals/edit-backingstore-modal')
          .then((m) => m.default({ bucketClass: obj, modalClassName: 'nb-modal' }))
          // eslint-disable-next-line no-console
          .catch((e) => console.error(e)),
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${blockPoolRef}/~new`,
      loader: () =>
        import(
          './components/block-pool/create-block-pool' /* webpackChunkName: "create-block-pool" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      id: 'delete',
      kind: models.CephBlockPoolModel.kind,
      label: '%ceph-storage-plugin~Delete BlockPool%',
      apiGroup: models.CephBlockPoolModel.apiGroup,
      callback: (kind, obj) => () => {
        const props = { kind, blockPoolConfig: obj };
        import(
          './components/modals/block-pool-modal/delete-block-pool-modal' /* webpackChunkName: "ceph-storage-delete-block-pool-modal" */
        )
          .then((m) => m.deleteBlockPoolModal(props))
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error('Error loading block Pool Modal', e);
          });
      },
    },
  },
];

export default plugin;
