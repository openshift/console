import * as _ from 'lodash';
import { AddAction } from '@console/dev-console/src/extensions/add-actions';
import {
  ModelDefinition,
  ModelFeatureFlag,
  RoutePage,
  Plugin,
  HrefNavItem,
} from '@console/plugin-sdk';
import { FLAG_RHOAS_KAFKA, FLAG_RHOAS, cloudServicesIcon } from './const';
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
  {
    type: 'AddAction',
    flags: {
      required: [FLAG_RHOAS],
    },
    properties: {
      id: 'rhoasAddAction',
      url: '/catalog?catalogType=managedservices',
      label: '%rhoas-plugin~Managed Services%',
      description:
        '%rhoas-plugin~Reduce operational complexity and focus on building and scaling applications that add more value.%',
      icon: cloudServicesIcon,
    },
  },
  ...rhoasTopologyPlugin,
  ...rhoasCatalogPlugin,
];

export default plugin;
