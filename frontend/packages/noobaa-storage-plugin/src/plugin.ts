import * as _ from 'lodash';
import {
  DashboardsCard,
  DashboardsTab,
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
  ResourceClusterNavItem,
  ResourceDetailsPage,
  ResourceListPage,
  ResourceNSNavItem,
  RoutePage,
  YAMLTemplate,
  ProjectDashboardInventoryItem,
  ClusterServiceVersionAction,
} from '@console/plugin-sdk';
import { GridPosition } from '@console/shared/src/components/dashboard/DashboardGrid';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { OCS_FLAG, ODF_MANAGED_FLAG } from '@console/ceph-storage-plugin/src/features';
import * as models from './models';
import { getObcStatusGroups } from './components/buckets-card/utils';

type ConsumedExtensions =
  | ModelFeatureFlag
  | ModelDefinition
  | DashboardsTab
  | DashboardsCard
  | ResourceNSNavItem
  | ResourceClusterNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | YAMLTemplate
  | RoutePage
  | ProjectDashboardInventoryItem
  | ClusterServiceVersionAction;

const NOOBAA_FLAG = 'NOOBAA';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
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
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
        models.NooBaaSystemModel,
      )}/noobaa/`,
      loader: () =>
        import('./components/noobaa-operator/noobaa-page' /* webpackChunkName: "create-bc" */).then(
          (m) => m.default,
        ),
    },
    flags: {
      required: [NOOBAA_FLAG],
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
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.NooBaaSystemModel,
      flag: NOOBAA_FLAG,
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'object-service',
      // t('noobaa-storage-plugin~Object Service')
      title: '%noobaa-storage-plugin~Object Service%',
    },
    flags: {
      required: [NOOBAA_FLAG, OCS_FLAG],
      disallowed: [ODF_MANAGED_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/status-card/status-card' /* webpackChunkName: "object-service-status-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/details-card/details-card' /* webpackChunkName: "object-service-details-card" */
        ).then((m) => m.DetailsCard),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/storage-efficiency-card/storage-efficiency-card' /* webpackChunkName: "object-service-storage-efficiency-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/buckets-card/buckets-card' /* webpackChunkName: "object-service-buckets-card" */
        ).then((m) => m.BucketsCard),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/capacity-breakdown/capacity-breakdown-card' /* webpackChunkName: "object-service-capacity-breakdown-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/data-consumption-card/data-consumption-card' /* webpackChunkName: "object-service-data-consumption-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/activity-card/activity-card' /* webpackChunkName: "object-service-activity-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/resource-providers-card/resource-providers-card' /* webpackChunkName: "object-service-resource-providers-card" */
        ).then((m) => m.ResourceProvidersCard),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      id: 'objectbuckets',
      section: 'storage',
      componentProps: {
        // t('noobaa-storage-plugin~Object Buckets')
        name: '%noobaa-storage-plugin~Object Buckets%',
        resource: models.NooBaaObjectBucketModel.plural,
      },
    },
    flags: {
      required: [NOOBAA_FLAG],
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
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      id: 'objectbucketclaims',
      section: 'storage',
      componentProps: {
        // t('noobaa-storage-plugin~Object Bucket Claims')
        name: '%noobaa-storage-plugin~Object Bucket Claims%',
        resource: models.NooBaaObjectBucketClaimModel.plural,
      },
    },
    flags: {
      required: [NOOBAA_FLAG],
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
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Project/Dashboard/Inventory/Item',
    properties: {
      model: models.NooBaaObjectBucketClaimModel,
      useAbbr: true,
      mapper: getObcStatusGroups,
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      kind: models.NooBaaBucketClassModel.kind,
      // t('noobaa-storage-plugin~Edit Bucket Class Resources')
      label: '%noobaa-storage-plugin~Edit Bucket Class Resources%',
      apiGroup: models.NooBaaBucketClassModel.apiGroup,
      callback: (kind, obj) => () =>
        import('./components/bucket-class/modals/edit-backingstore-modal')
          .then((m) => m.default({ bucketClass: obj, modalClassName: 'nb-modal' }))
          // eslint-disable-next-line no-console
          .catch((e) => console.error(e)),
    },
  },
];

export default plugin;
