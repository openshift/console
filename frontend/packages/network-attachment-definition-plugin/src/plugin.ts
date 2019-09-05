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
import { NetworkAttachmentDefinitionsYAMLTemplates } from './models/templates';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ResourceListPage
  | ModelFeatureFlag
  | YAMLTemplate
  | ModelDefinition
  | RoutePage;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Networking',
      componentProps: {
        name: 'Network Attachment Definitions',
        resource: models.NetworkAttachmentDefinitionModel.plural,
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
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.NetworkAttachmentDefinitionModel,
      template: NetworkAttachmentDefinitionsYAMLTemplates.getIn(['default']),
    },
  },
];

export default plugin;
