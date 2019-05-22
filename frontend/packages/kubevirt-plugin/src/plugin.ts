import { Plugin, ResourceNSNavItem, ResourceListPage, ResourceDetailPage, ModelFeatureFlag } from '@console/plugin-sdk';
import { VirtualMachineModel } from './models';

type ConsumedExtensions = ResourceNSNavItem | ResourceListPage | ResourceDetailPage | ModelFeatureFlag;

const FLAG_KUBEVIRT = 'KUBEVIRT';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: VirtualMachineModel,
      flag: FLAG_KUBEVIRT,
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: { // TODO(mlibra): set order, see section.tsx
      section: 'Workloads',
      componentProps: {
        name: 'Virtual Machines',
        resource: VirtualMachineModel.plural,
        required: FLAG_KUBEVIRT,
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
  // {
  //   type: 'ResourcePage/Detail',
  //   properties: {
  //     model: VirtualMachineModel,
  //     loader: () => import('./components/vm-detail' /* webpackChunkName: "virtual-machines" */).then(m => m.VirtualMachinesDetailsPage),
  //   },
  // },
];

export default plugin;
