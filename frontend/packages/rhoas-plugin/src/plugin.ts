import * as _ from 'lodash';
import { AddAction } from '@console/dev-console/src/extensions/add-actions';
import * as rhoasIcon from '@console/internal/imgs/logos/other-unknown.svg';
import {
  ModelDefinition,
  ModelFeatureFlag,
  RoutePage,
  Plugin,
  HrefNavItem,
} from '@console/plugin-sdk';
import { FLAG_RHOAS_KAFKA } from './const';

import * as models from './models';

type ConsumedExtensions = ModelDefinition | ModelFeatureFlag | RoutePage | AddAction | HrefNavItem;

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
      required: [],
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
            './components/rhosak-page/ManagedKafkas' /* webpackChunkName: "managedservices-plugin-releases-list-page" */
          )
        ).default,
    },
    flags: {
      required: [],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'rhoas',
      perspective: 'dev',
      section: 'resources',
      insertBefore: 'project',
      componentProps: {
        name: 'rhoas',
        href: '/rhoas',
        testID: 'rhoas',
        'data-quickstart-id': 'qs-nav-helm',
      },
    },
    flags: {
      required: [],
    },
  },
  {
    type: 'AddAction',
    flags: {
      required: [],
    },
    properties: {
      id: 'rhosak',
      url: '/managedServices',
      label: 'ManagedServices',
      description: 'ManagedService',
      icon: rhoasIcon,
    },
  },
];

export default plugin;
