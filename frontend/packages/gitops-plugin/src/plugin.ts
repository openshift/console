import * as _ from 'lodash';
import { ModelDefinition, RoutePage, Plugin, ModelFeatureFlag } from '@console/plugin-sdk';
import { FLAG_OPENSHIFT_GITOPS } from './const';
import * as models from './models';

type ConsumedExtensions = ModelDefinition | ModelFeatureFlag | RoutePage;

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
      model: models.GitOpsServiceModel,
      flag: FLAG_OPENSHIFT_GITOPS,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/environments',
      loader: async () =>
        (
          await import(
            './components/GitOpsListPage' /* webpackChunkName: "gitops-plugin-list-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/environments/:appName',
      loader: async () =>
        (
          await import(
            './components/GitOpsDetailsPage' /* webpackChunkName: "gitops-plugin-details-page" */
          )
        ).default,
    },
  },
];

export default plugin;
