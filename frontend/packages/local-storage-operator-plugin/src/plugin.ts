import * as _ from 'lodash';
import {
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
  RoutePage,
  HorizontalNavTab,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import * as models from './models';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { NodeModel } from '@console/internal/models';

type ConsumedExtensions = HorizontalNavTab | ModelFeatureFlag | ModelDefinition | RoutePage;

const LSO_FLAG = 'LSO';
const LSO_DEVICE_DISCOVERY = 'LSO_DEVICE_DISCOVERY';

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
      model: models.LocalVolumeModel,
      flag: LSO_FLAG,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.LocalVolumeDiscoveryResult,
      flag: LSO_DEVICE_DISCOVERY,
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
      required: [LSO_FLAG],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: NodeModel,
      page: {
        href: 'disks',
        name: 'Disks',
      },
      loader: () =>
        import(
          './components/disks-list/disks-list-page' /* webpackChunkName: "lso-disks-list" */
        ).then((m) => m.default),
    },
    flags: {
      required: [LSO_DEVICE_DISCOVERY],
    },
  },
];

export default plugin;
