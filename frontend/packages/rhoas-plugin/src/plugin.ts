import * as _ from 'lodash';
import { AddAction } from '@console/dev-console/src/extensions/add-actions';
import {
  ModelDefinition,
  ModelFeatureFlag,
  RoutePage,
  Plugin,
  HrefNavItem,
} from '@console/plugin-sdk';
import { FLAG_RHOAS_KAFKA, FLAG_RHOAS, managedKafkaIcon } from './const';
import { rhoasTopologyPlugin, TopologyConsumedExtensions } from './topology/rhoas-topology-plugin';
import * as models from './models';
import { rhoasCatalogPlugin, CatalogConsumedExtensions } from './catalog/rhoas-catalog-plugin';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | RoutePage
  | AddAction
  | HrefNavItem
  | TopologyConsumedExtensions
  | CatalogConsumedExtensions;

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
      model: models.ManagedKafkaConnectionModel,
      flag: FLAG_RHOAS_KAFKA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.ManagedServiceAccountRequest,
      flag: FLAG_RHOAS,
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
      required: [FLAG_RHOAS],
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
      required: [FLAG_RHOAS],
    },
    properties: {
      id: 'rhoasAddAction',
      url: '/managedServices',
      label: '%rhoas-plugin~Managed Services%',
      description:
        '%rhoas-plugin~Reduce operational complexity and focus on building and scaling applications that add more value.%',
      icon: managedKafkaIcon,
    },
  },
  ...rhoasTopologyPlugin,
  ...rhoasCatalogPlugin,
];

export default plugin;
