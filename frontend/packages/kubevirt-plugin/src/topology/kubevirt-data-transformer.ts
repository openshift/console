import {
  apiVersionForModel,
  K8sResourceKind,
  PersistentVolumeClaimKind,
  PodKind,
  referenceFor,
} from '@console/internal/module/k8s';
import {
  OverviewItem,
  getRoutesForServices,
  getBuildConfigsForResource,
  getReplicationControllersForResource,
  getServicesForResource,
} from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { Model } from '@patternfly/react-topology';
import {
  TopologyDataObject,
  TopologyDataResources,
  getRoutesURL,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
  WorkloadModelProps,
} from '@console/dev-console/src/components/topology';
import { VMIKind, VMKind } from '../types';
import { VirtualMachineModel } from '../models';
import { TYPE_VIRTUAL_MACHINE } from './components/const';
import { findVMIPod } from '../selectors/pod/selectors';
import { getVMStatus } from '../statuses/vm/vm-status';
import { V1alpha1DataVolume } from '../types/vm/disk/V1alpha1DataVolume';
import { VMImportKind } from '../types/vm-import/ovirt/vm-import';
import { VMNodeData } from './types';

export const getOperatingSystemImage = (vm: VMKind, templates: K8sResourceKind[]): string => {
  const templateName = vm.metadata?.labels?.['vm.kubevirt.io/template'];
  const template = templateName && templates.find((t) => t.metadata.name === templateName);
  if (!template) {
    return '';
  }

  return getImageForIconClass(template.metadata.annotations.iconClass);
};

export const createVMOverviewItem = (vm: K8sResourceKind, resources: any): OverviewItem => {
  if (!vm.apiVersion) {
    vm.apiVersion = apiVersionForModel(VirtualMachineModel);
  }
  if (!vm.kind) {
    vm.kind = VirtualMachineModel.kind;
  }
  const { name } = vm.metadata;
  const vmis = resources.virtualmachineinstances.data;
  const vmi = vmis.find((instance) => instance.metadata.name === name) as VMIKind;
  const { visibleReplicationControllers } = getReplicationControllersForResource(vm, resources);
  const [current, previous] = visibleReplicationControllers;
  const buildConfigs = getBuildConfigsForResource(vm, resources);
  const services = getServicesForResource(vm, resources);
  const routes = getRoutesForServices(services, resources);
  const laucherPod = findVMIPod(vmi, resources.pods.data);
  const pods = laucherPod ? [laucherPod] : [];

  const overviewItems = {
    buildConfigs,
    current,
    obj: vm,
    previous,
    pods,
    routes,
    services,
    isMonitorable: false,
    isOperatorBackedService: false,
  };

  return overviewItems;
};

const createTopologyVMNodeData = (
  resource: K8sResourceKind,
  vmOverview: OverviewItem,
  resources: TopologyDataResources,
): TopologyDataObject<VMNodeData> => {
  const { uid, name, labels } = resource.metadata;
  const vmis = resources.virtualmachineinstances?.data;
  const vmi = vmis.find((instance) => instance.metadata.name === name) as VMIKind;
  const pods = resources.pods?.data as PodKind[];
  const migrations = resources.migrations?.data;
  const pvcs = resources.pvcs?.data as PersistentVolumeClaimKind[];
  const dataVolumes = resources.dataVolumes?.data as V1alpha1DataVolume[];
  const vmImports = resources.vmImports?.data as VMImportKind[];

  const vmStatusBundle = getVMStatus({
    vm: resource as VMKind,
    vmi,
    pods,
    migrations,
    pvcs,
    dataVolumes,
    vmImports,
  });

  return {
    id: uid,
    name: name || labels['app.kubernetes.io/instance'],
    type: TYPE_VIRTUAL_MACHINE,
    resource,
    resources: vmOverview,
    data: {
      url: getRoutesURL(resource, vmOverview),
      kind: referenceFor(resource),
      vmi,
      vmStatusBundle,
      osImage: getOperatingSystemImage(resource as VMKind, resources.virtualmachinetemplates.data),
    },
  };
};

export const getKubevirtTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
): Promise<Model> => {
  const vmsDataModel: Model = { nodes: [], edges: [] };
  const vmsResources = [];

  if (resources.virtualmachines?.data.length) {
    resources.virtualmachines.data.forEach((resource) => {
      const vmOverview = createVMOverviewItem(resource, resources);
      const { uid } = resource.metadata;
      vmsResources.push(uid);
      const data = createTopologyVMNodeData(resource, vmOverview, resources);
      vmsDataModel.nodes.push(
        getTopologyNodeItem(resource, TYPE_VIRTUAL_MACHINE, data, WorkloadModelProps),
      );
      mergeGroup(getTopologyGroupItems(resource), vmsDataModel.nodes);
    });
  }

  return Promise.resolve(vmsDataModel);
};
