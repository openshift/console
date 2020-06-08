import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ResourceDetailsPage,
  ResourceListPage,
  ModelFeatureFlag,
  YAMLTemplate,
  ModelDefinition,
  RoutePage,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import { FLAG_KUBEVIRT } from '@console/kubevirt-plugin/src/plugin';
import * as models from './models';
import { NetworkAttachmentDefinitionsYAMLTemplates } from './models/templates';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ResourceDetailsPage
  | ResourceListPage
  | ModelFeatureFlag
  | YAMLTemplate
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
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Networking',
      componentProps: {
        name: 'Network Attachment Definitions',
        resource: referenceForModel(models.NetworkAttachmentDefinitionModel),
      },
    },
    flags: {
      required: [FLAG_NET_ATTACH_DEF, FLAG_KUBEVIRT],
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
    type: 'YAMLTemplate',
    properties: {
      model: models.NetworkAttachmentDefinitionModel,
      template: NetworkAttachmentDefinitionsYAMLTemplates.getIn(['default']),
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
