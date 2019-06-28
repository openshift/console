import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  ModelFeatureFlag,
  YAMLTemplate,
  ModelDefinition,
  RoutePage,
} from '@console/plugin-sdk';
import { TemplateModel } from '@console/internal/models';

import * as models from './models';
import { yamlTemplates } from './yaml-templates';

import './style.scss';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | ModelFeatureFlag
  | YAMLTemplate
  | ModelDefinition
  | RoutePage;

const FLAG_KUBEVIRT = 'KUBEVIRT';

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
      model: models.VirtualMachineModel,
      flag: FLAG_KUBEVIRT,
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Workloads',
      componentProps: {
        name: 'Virtual Machines',
        resource: models.VirtualMachineModel.plural,
        required: FLAG_KUBEVIRT,
      },
      mergeAfter: 'Pods',
    },
  },
  {
    // NOTE(yaacov): vmtemplates is a template resource with a selector.
    // 'NavItem/ResourceNS' is used, and not 'NavItem/Href', because it injects
    // the namespace needed to get the correct link to a resource ( template with selector ) in our case.
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Workloads',
      componentProps: {
        name: 'Virtual Machine Templates',
        resource: 'vmtemplates',
        required: FLAG_KUBEVIRT,
      },
      mergeAfter: 'Virtual Machines',
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.VirtualMachineModel,
      loader: () =>
        import('./components/vms/vm' /* webpackChunkName: "kubevirt-virtual-machines" */).then(
          (m) => m.VirtualMachinesPage,
        ),
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.VirtualMachineModel,
      template: yamlTemplates.getIn([models.VirtualMachineModel, 'default']),
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: TemplateModel,
      template: yamlTemplates.getIn([TemplateModel, 'vm-template']),
      templateName: 'vm-template',
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.VirtualMachineModel,
      loader: () =>
        import(
          './components/vms/vm-details-page' /* webpackChunkName: "kubevirt-virtual-machine-details" */
        ).then((m) => m.VirtualMachinesDetailsPage),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/vmtemplates', '/k8s/all-namespaces/vmtemplates'],
      loader: () =>
        import(
          './components/vm-templates/vm-template' /* webpackChunkName: "kubevirt-vmtemplates" */
        ).then((m) => m.VirtualMachineTemplatesPage),
    },
  },
];

export default plugin;
