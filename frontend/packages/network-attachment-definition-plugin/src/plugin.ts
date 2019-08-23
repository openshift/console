import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ResourceListPage,
  ModelFeatureFlag,
  YAMLTemplate,
  ModelDefinition,
  RoutePage,
} from '@console/plugin-sdk';
import * as models from './models';

type ConsumedExtensions =
  | ResourceNSNavItem
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
        resource: models.NetworkAttachmentDefinitionModel.plural,
        required: FLAG_NET_ATTACH_DEF,
      },
      mergeAfter: 'Network Policies',
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.NetworkAttachmentDefinitionModel,
      loader: () =>
        import(
          './components/network-attachment-definitions/network-attachment-definition' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.NetworkAttachmentDefinitionsPage),
    },
  },
];

export default plugin;
