import * as _ from 'lodash';
import { AddAction } from '@console/dynamic-plugin-sdk/src/extensions/add-actions';
import {
  ModelDefinition,
  ModelFeatureFlag,
  RoutePage,
  Plugin,
  HrefNavItem,
} from '@console/plugin-sdk';
import { FLAG_RHOAS_KAFKA, FLAG_RHOAS } from './const';
import { rhoasTopologyPlugin, TopologyConsumedExtensions } from './topology/rhoas-topology-plugin';
import * as models from './models';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | RoutePage
  | AddAction
  | HrefNavItem
  | TopologyConsumedExtensions;

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
      model: models.KafkaConnectionModel,
      flag: FLAG_RHOAS_KAFKA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.CloudServiceAccountRequest,
      flag: FLAG_RHOAS,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/rhoas/ns/:ns/:service'],
      loader: async () =>
        (
          await import(
            './components/service-list/ServiceListPage' /* webpackChunkName: "services-kafka-plugin-releases-kafka-page" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_RHOAS_KAFKA],
    },
  },
  ...rhoasTopologyPlugin,
];

export default plugin;
