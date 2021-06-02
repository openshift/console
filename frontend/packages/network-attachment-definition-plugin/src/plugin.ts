import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  Plugin,
  ResourceDetailsPage,
  ResourceListPage,
  ModelFeatureFlag,
  ModelDefinition,
  RoutePage,
} from '@console/plugin-sdk';
import * as models from './models';

type ConsumedExtensions =
  | ResourceDetailsPage
  | ResourceListPage
  | ModelFeatureFlag
  | ModelDefinition
  | RoutePage;

const FLAG_NET_ATTACH_DEF = 'NET_ATTACH_DEF';

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
      model: models.NetworkAttachmentDefinitionModel,
      flag: FLAG_NET_ATTACH_DEF,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.NetworkAttachmentDefinitionModel,
      loader: () =>
        import(
          './components/network-attachment-definitions/NetworkAttachmentDefinition' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.NetworkAttachmentDefinitionsPage),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.NetworkAttachmentDefinitionModel,
      loader: () =>
        import(
          './components/network-attachment-definitions/NetworkAttachmentDefinitionDetailsPage' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.NetworkAttachmentDefinitionsDetailsPage),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [`/k8s/ns/:ns/${referenceForModel(models.NetworkAttachmentDefinitionModel)}/~new`],
      loader: () =>
        import(
          './components/network-attachment-definitions/NetworkAttachmentDefinitionCreateYaml' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.default),
    },
    flags: {
      required: [FLAG_NET_ATTACH_DEF],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [`/k8s/ns/:ns/${referenceForModel(models.NetworkAttachmentDefinitionModel)}/~new/form`],
      loader: () =>
        import(
          './components/network-attachment-definitions/NetworkAttachmentDefinitionsForm' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.default),
    },
    flags: {
      required: [FLAG_NET_ATTACH_DEF],
    },
  },
];

export default plugin;
