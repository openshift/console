import * as React from 'react';
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
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewInventoryItem,
  DashboardsInventoryItemGroup,
} from '@console/plugin-sdk';
import { TemplateModel, PodModel } from '@console/internal/models';
import * as models from './models';
import { VMTemplateYAMLTemplates, VirtualMachineYAMLTemplates } from './models/templates';
import { getKubevirtHealthState } from './components/dashboards-page/overview-dashboard/health';
import {
  getVMStatusGroups,
  VMOffGroupIcon,
} from './components/dashboards-page/overview-dashboard/inventory';

import './style.scss';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | ModelFeatureFlag
  | YAMLTemplate
  | ModelDefinition
  | RoutePage
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewInventoryItem
  | DashboardsInventoryItemGroup;

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
      template: VirtualMachineYAMLTemplates.getIn(['default']),
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: TemplateModel,
      template: VMTemplateYAMLTemplates.getIn(['vm-template']),
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
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/vmtemplates/~new'],
      loader: () =>
        import(
          './components/vm-templates/vm-template-create-yaml' /* webpackChunkName: "kubevirt-vmtemplates-create-yaml" */
        ).then((m) => m.CreateVMTemplateYAML),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/k8s/ns/:ns/vmtemplates/:name`,
      loader: () =>
        import(
          './components/vm-templates/vm-template-details-page' /* webpackChunkName: "kubevirt-virtual-machine-details" */
        ).then((m) => m.VMTemplateDetailsPage),
    },
  },
  {
    type: 'Dashboards/Overview/Health/URL',
    properties: {
      title: 'Virtualization',
      url: `/apis/subresources.${models.VirtualMachineModel.apiGroup}/${
        models.VirtualMachineModel.apiVersion
      }/healthz`,
      healthHandler: getKubevirtHealthState,
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      resource: {
        isList: true,
        kind: models.VirtualMachineModel.kind,
        prop: 'vms',
      },
      additionalResources: [
        {
          isList: true,
          kind: PodModel.kind,
          prop: 'pods',
        },
        {
          isList: true,
          kind: models.VirtualMachineInstanceMigrationModel.kind,
          prop: 'migrations',
        },
      ],
      model: models.VirtualMachineModel,
      mapper: getVMStatusGroups,
      useAbbr: true,
    },
  },
  {
    type: 'Dashboards/Inventory/Item/Group',
    properties: {
      id: 'vm-off',
      icon: <VMOffGroupIcon />,
    },
  },
];

export default plugin;
