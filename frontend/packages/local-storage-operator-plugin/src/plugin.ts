import * as _ from 'lodash';
import { ModelDefinition, ModelFeatureFlag, Plugin, RoutePage } from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import * as models from './models';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';

type ConsumedExtensions = ModelFeatureFlag | ModelDefinition | RoutePage;

const LSO_FLAG = 'LSO';

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
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
        models.LocalVolumeSetModel,
      )}/~new`,
      loader: () =>
        import(
          './components/local-volume-set/create-local-volume-set' /* webpackChunkName: "create-local-volume-set" */
        ).then((m) => m.default),
      required: LSO_FLAG,
    },
  },
];

export default plugin;
