import * as _ from 'lodash';
import { AddAction } from '@console/dev-console/src/extensions/add-actions';
import {
  ModelDefinition,
  ModelFeatureFlag,
  RoutePage,
  Plugin,
  HrefNavItem,
} from '@console/plugin-sdk';
import { FLAG_RHOAS_KAFKA, temporaryIcon } from './const';
import { rhoasTopologyPlugin, TopologyConsumedExtensions } from './topology/rhoas-topology-plugin'
import * as models from './models';

type ConsumedExtensions = ModelDefinition
  | ModelFeatureFlag
  | RoutePage
  | AddAction
  | HrefNavItem
  | TopologyConsumedExtensions

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  // TODO Use flag in the system
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.ManagedKafkaRequestModel,
      flag: FLAG_RHOAS_KAFKA,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/managedServices', '/managedServices/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/managed-services-list/ManagedServicesList' /* webpackChunkName: "managedservices-plugin-releases-list-page" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_RHOAS_KAFKA],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/managedServices/managedkafka', '/managedServices/managedkafka/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/managed-services-kafka/ManagedKafkas' /* webpackChunkName: "managedservices-kafka-plugin-releases-kafka-page" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_RHOAS_KAFKA],
    },
  },
  {
    type: 'AddAction',
    flags: {
      required: [FLAG_RHOAS_KAFKA],
    },
    properties: {
      id: 'rhosak',
      url: '/managedServices',
      label: 'Managed Services',
      description: 'Reduce operational complexity and focus on building and scaling applications that add more value.',
      icon: temporaryIcon,
    },
  },
  ...rhoasTopologyPlugin
];

export default plugin;
