import * as _ from 'lodash';
import { AddAction } from '@console/dynamic-plugin-sdk';
import { ModelDefinition, ModelFeatureFlag, RoutePage, Plugin } from '@console/plugin-sdk';
import { FLAG_RHOAS } from './const';
import * as models from './models';
import { rhoasTopologyPlugin, TopologyConsumedExtensions } from './topology/rhoas-topology-plugin';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | RoutePage
  | AddAction
  | TopologyConsumedExtensions;

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
      path: ['/rhoas/ns/:ns/:service'],
      loader: async () =>
        (
          await import(
            './components/service-list/ServiceListPage' /* webpackChunkName: "services-kafka-plugin-releases-kafka-page" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_RHOAS],
    },
  },
  ...rhoasTopologyPlugin,
];

export default plugin;
