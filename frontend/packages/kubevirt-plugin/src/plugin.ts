import * as _ from 'lodash-es';
import { Plugin, ResourceNSNavItem, ResourceListPage, ResourceDetailPage, ModelFeatureFlag, YamlTemplate, ModelDefinition } from '@console/plugin-sdk';

import * as models from './models';
import { vmYamlTemplate } from './yaml-templates';

type ConsumedExtensions = ResourceNSNavItem | ResourceListPage | ResourceDetailPage | ModelFeatureFlag | YamlTemplate | ModelDefinition;

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
      mergeAfter: 'Pods', // rendered name of the resource navigation link in the left-side menu
    },
  },
  {
    type: 'ResourcePage/List',
    properties: {
      model: models.VirtualMachineModel,
      loader: () => import('./components/vm' /* webpackChunkName: "virtual-machines" */).then(m => m.VirtualMachinesPage),
    },
  },
  {
    type: 'YamlTemplate',
    properties: {
      model: models.VirtualMachineModel,
      template: vmYamlTemplate,
    },
  },
  // {
  //   type: 'ResourcePage/Detail',
  //   properties: {
  //     model: VirtualMachineModel,
  //     loader: () => import('./components/vm-detail' /* webpackChunkName: "virtual-machines" */).then(m => m.VirtualMachinesDetailsPage),
  //   },
  // },
];

export default plugin;
