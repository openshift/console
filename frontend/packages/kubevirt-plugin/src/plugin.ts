import { Plugin, ResourceNSNavItem, ResourceListPage, ResourceDetailPage, ModelFeatureFlag } from '@console/plugin-sdk';
import { VirtualMachineModel } from './models';

type ConsumedExtensions = ResourceNSNavItem | ResourceListPage | ResourceDetailPage | ModelFeatureFlag;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: VirtualMachineModel,
      flag: 'KUBEVIRT',
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: { // TODO: set order, see section.tsx
      section: 'Workloads',
      componentProps: {
        name: 'Virtual Machines',
        resource: 'virtualmachines',
        required: 'KUBEVIRT',
      },
    },
  },
  {
    type: 'ResourcePage/List',
    properties: {
      model: VirtualMachineModel,
      loader: () => import('./components/vm' /* webpackChunkName: "virtual-machines" */).then(m => m.VirtualMachinesPage),
    },
  },
];

export default plugin;
