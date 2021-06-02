import * as _ from 'lodash';
import { NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import {
  CustomFeatureFlag,
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
  RoutePage,
  HorizontalNavTab,
} from '@console/plugin-sdk';
import { detectOCSAttachedDeviceMode, OCS_ATTACHED_DEVICES_FLAG } from './features';
import * as models from './models';

type ConsumedExtensions =
  | CustomFeatureFlag
  | HorizontalNavTab
  | ModelFeatureFlag
  | ModelDefinition
  | RoutePage;

const LSO_LOCAL_VOLUME_SET = 'LSO_LOCAL_VOLUME_SET';
export const LSO_DEVICE_DISCOVERY = 'LSO_DEVICE_DISCOVERY';

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
      model: models.LocalVolumeSetModel,
      flag: LSO_LOCAL_VOLUME_SET,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.LocalVolumeDiscovery,
      flag: LSO_DEVICE_DISCOVERY,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectOCSAttachedDeviceMode,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
        models.LocalVolumeSetModel,
      )}/~new`,
      loader: () =>
        import(
          './components/local-volume-set/create-local-volume-set' /* webpackChunkName: "lso-create-local-volume-set" */
        ).then((m) => m.default),
    },
    flags: {
      required: [LSO_LOCAL_VOLUME_SET],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: NodeModel,
      page: {
        href: 'disks',
        // t('lso-plugin~Disks')
        name: '%lso-plugin~Disks%',
      },
      loader: () =>
        import(
          './components/disks-list/disks-list-page' /* webpackChunkName: "lso-disks-list" */
        ).then((m) => m.NodesDisksListPage),
    },
    flags: {
      required: [LSO_DEVICE_DISCOVERY],
      disallowed: [OCS_ATTACHED_DEVICES_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
        models.LocalVolumeDiscovery,
      )}/~new`,
      loader: () =>
        import(
          './components/local-volume-discovery/create-local-volume-discovery' /* webpackChunkName: "lso-create-local-volume-discovery" */
        ).then((m) => m.CreateLocalVolumeDiscovery),
    },
    flags: {
      required: [LSO_DEVICE_DISCOVERY],
    },
  },
];

export default plugin;
