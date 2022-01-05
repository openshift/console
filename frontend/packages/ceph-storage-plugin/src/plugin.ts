import * as _ from 'lodash';
import {
  ClusterServiceVersionAction,
  DashboardsOverviewHealthResourceSubsystem,
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
  ResourceListPage,
} from '@console/plugin-sdk';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { referenceForModel } from '@console/internal/module/k8s';
import * as models from './models';
import * as mockModels from './mock-models';
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
  MCG_FLAG,
  OCS_FLAG,
  ODF_MANAGED_FLAG,
  detectManagedODF,
  detectComponents,
  MCG_STANDALONE,
  FEATURES,
  RGW_FLAG,
} from './features';
import { ODF_MODEL_FLAG } from './constants';
import { STORAGE_CLUSTER_SYSTEM_KIND } from './constants/create-storage-system';

type ConsumedExtensions =
  | ModelFeatureFlag
  | HorizontalNavTab
  | ModelDefinition
  | DashboardsOverviewHealthResourceSubsystem<WatchCephResource>
  | RoutePage
  | CustomFeatureFlag
  | ClusterServiceVersionAction
  | ResourceDetailsPage
  | ResourceTabPage
  | ClusterServiceVersionAction
  | DashboardsOverviewResourceActivity
  | StorageClassProvisioner
  | ResourceListPage;

const apiObjectRef = referenceForModel(models.OCSServiceModel);
const blockPoolRef = referenceForModel(models.CephBlockPoolModel);
const storageSystemGvk = referenceForModel(models.StorageSystemModel);

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
    type: 'FeatureFlag/Model',
    properties: {
      model: models.StorageSystemModel,
      flag: ODF_MODEL_FLAG,
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
      required: [OCS_MODEL_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectManagedODF,
    },
    flags: {
      required: [OCS_MODEL_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectManagedODF,
    },
    flags: {
      required: [ODF_MODEL_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectComponents,
    },
    flags: {
      required: [OCS_MODEL_FLAG],
    },
  },
  {
    type: 'StorageClass/Provisioner',
    properties: {
      getStorageClassProvisioner: StorageClassFormProvisoners,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [
        `/k8s/ns/:ns/${referenceForModel(
          ClusterServiceVersionModel,
        )}/:appName/${storageSystemGvk}/~new`,
        `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${storageSystemGvk}/~new`,
      ],
      loader: () =>
        import(
          './components/create-storage-system/create-storage-system' /* webpackChunkName: "create-storage-system" */
        ).then((m) => m.default),
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
        const props = { blockPoolConfig: obj };
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
    type: 'Page/Resource/List',
    properties: {
      model: models.NooBaaObjectBucketModel,
      loader: () =>
        import(
          './components/object-bucket-page/object-bucket' /* webpackChunkName: "object-bucket-page" */
        ).then((m) => m.ObjectBucketsPage),
    },
    flags: {
      required: [OCS_MODEL_FLAG],
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
      required: [OCS_MODEL_FLAG],
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
      required: [OCS_MODEL_FLAG],
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
      required: [OCS_MODEL_FLAG],
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
  // When RGW is available without MCG
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
      required: [RGW_FLAG],
      disallowed: [MCG_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/ocs-dashboards`,
      loader: () => import('./components/dashboards/ocs-system-dashboard').then((m) => m.default),
    },
    flags: {
      required: [OCS_FLAG],
      disallowed: [ODF_MANAGED_FLAG, ODF_MODEL_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/ocs-dashboards`,
      loader: () => import('./components/dashboards/ocs-system-dashboard').then((m) => m.default),
    },
    flags: {
      required: [MCG_FLAG],
      disallowed: [OCS_FLAG, ODF_MODEL_FLAG],
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
          .catch((e) => console.error('BucketClassEditModal could not be loaded', e)),
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
        const props = { blockPoolConfig: obj };
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
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      id: 'add-capacity',
      kind: models.StorageSystemModel.kind,
      label: '%ceph-storage-plugin~Add Capacity%',
      apiGroup: models.StorageSystemModel.apiGroup,
      hidden: (kind, obj) => {
        if (obj.spec.kind !== STORAGE_CLUSTER_SYSTEM_KIND) {
          return true;
        }
        return false;
      },
      callback: (kind, obj) => () => {
        const props = { storageSystem: obj };
        import(
          './components/modals/add-capacity-modal/add-capacity-modal' /* webpackChunkName: "ceph-storage-add-capacity-modal" */
        )
          .then((m) => m.addSSCapacityModal(props))
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error('Error loading Add Capacity Modal', e);
          });
      },
    },
    flags: {
      disallowed: [OCS_INDEPENDENT_FLAG, MCG_STANDALONE, FEATURES.ADD_CAPACITY],
    },
  },
  // Adding this Extension because dynamic endpoint is not avbl
  // Todo(bipuladh): Remove once SDK is mature enough to support list page
  {
    type: 'HorizontalNavTab',
    properties: {
      model: mockModels.StorageSystemMockModel,
      page: {
        name: '%ceph-storage-plugin~Storage Systems%',
        href: 'systems',
      },
      loader: async () =>
        (
          await import(
            './components/odf-system/odf-system-list' /* webpackChunkName: "odf-system-list" */
          )
        ).default,
    },
    flags: {
      disallowed: [FEATURES.SS_LIST],
    },
  },
  // Adding this Extension because dynamic endpoint is not avbl
  // Todo(bipuladh): Remove once SDK is mature enough to support list page
  {
    type: 'HorizontalNavTab',
    properties: {
      model: mockModels.StorageSystemMockModel,
      page: {
        // t('ceph-storage-plugin~Backing Store')
        name: '%ceph-storage-plugin~Backing Store%',
        href: 'resource/noobaa.io~v1alpha1~BackingStore',
      },
      loader: async () =>
        (
          await import(
            './components/odf-resources/resource-list-page' /* webpackChunkName: "odf-system-list" */
          )
        ).BackingStoreListPage,
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  // Adding this Extension because dynamic endpoint is not avbl
  // Todo(bipuladh): Remove once SDK is mature enough to support list page
  {
    type: 'HorizontalNavTab',
    properties: {
      model: mockModels.StorageSystemMockModel,
      page: {
        // t('ceph-storage-plugin~Bucket Class')
        name: '%ceph-storage-plugin~Bucket Class%',
        href: 'resource/noobaa.io~v1alpha1~BucketClass',
      },
      loader: async () =>
        (
          await import(
            './components/odf-resources/resource-list-page' /* webpackChunkName: "odf-system-list" */
          )
        ).BucketClassListPage,
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
  // Adding this Extension because dynamic endpoint is not avbl
  // Todo(bipuladh): Remove once SDK is mature enough to support list page
  {
    type: 'HorizontalNavTab',
    properties: {
      model: mockModels.StorageSystemMockModel,
      page: {
        // t('ceph-storage-plugin~Namespace Store')
        name: '%ceph-storage-plugin~Namespace Store%',
        href: 'resource/noobaa.io~v1alpha1~NamespaceStore',
      },
      loader: async () =>
        (
          await import(
            './components/odf-resources/resource-list-page' /* webpackChunkName: "odf-system-list" */
          )
        ).NamespaceStoreListPage,
    },
    flags: {
      required: [MCG_FLAG],
    },
  },
];

export default plugin;
