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

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | RoutePage
  | AddAction
  | HrefNavItem


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
      model: models.ManagedKafkaRequestModel,
      flag: FLAG_RHOAS_KAFKA,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/managedServices/rhosak', '/managedServices/rhosak/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/rhosak-page/ManagedKafkas' /* webpackChunkName: "helm-plugin-releases-list-page" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_RHOAS_KAFKA],
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
      required: [FLAG_RHOAS_KAFKA],
    },
  },
  {
    type: 'AddAction',
    flags: {
      required: [],
    },
    properties: {
      id: 'rhosak',
      url: '/managedServices/rhosak',
      label: 'ManagedService Kafka',
      description: 'ManagedService',
      icon: rhoasIcon,
    },
  }
];

export default plugin;
