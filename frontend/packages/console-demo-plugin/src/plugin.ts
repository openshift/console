import * as _ from 'lodash-es';

import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  HrefNavItem,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  ResourceListPage,
  ResourceDetailPage,
} from '@console/plugin-sdk';

// TODO(vojtech): internal code needed by plugins should be moved to console-shared package
import { PodModel } from '@console/internal/models';
import { FLAGS } from '@console/internal/const';

import * as models from './models';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceClusterNavItem
  | ResourceListPage
  | ResourceDetailPage;

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
      model: PodModel,
      flag: 'TEST_MODEL_FLAG',
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Home',
      componentProps: {
        name: 'Test Href Link',
        href: '/test',
        required: 'TEST_MODEL_FLAG',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Home',
      componentProps: {
        name: 'Test ResourceNS Link',
        resource: 'pods',
        required: 'TEST_MODEL_FLAG',
      },
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      section: 'Home',
      componentProps: {
        name: 'Test ResourceCluster Link',
        resource: 'projects',
        required: [FLAGS.OPENSHIFT, 'TEST_MODEL_FLAG'],
      },
    },
  },
  {
    type: 'ResourcePage/List',
    properties: {
      model: PodModel,
      loader: () => import('@console/internal/components/pod' /* webpackChunkName: "pod" */).then(m => m.PodsPage),
    },
  },
  {
    type: 'ResourcePage/Detail',
    properties: {
      model: PodModel,
      loader: () => import('@console/internal/components/pod' /* webpackChunkName: "pod" */).then(m => m.PodsDetailsPage),
    },
  },
];

export default plugin;
