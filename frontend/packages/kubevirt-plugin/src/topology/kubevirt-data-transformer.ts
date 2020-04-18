import { apiVersionForModel, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import {
  OverviewItem,
  getRoutesForServices,
  getBuildConfigsForResource,
  getReplicationControllersForResource,
  getServicesForResource,
} from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  TopologyDataModel,
  TopologyDataObject,
  TopologyDataResources,
  getRoutesURL,
  addToTopologyDataModel,
  getTopologyEdgeItems,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
} from '@console/dev-console/src/components/topology';
import { VMIKind, VMKind } from '../types';
import { VirtualMachineModel } from '../models';
import { TYPE_VIRTUAL_MACHINE } from './components/const';
import { findVMIPod } from '../selectors/pod/selectors';
import { getVMStatus } from '../statuses/vm/vm-status';

export const kubevirtAllowedResources = ['virtualmachines'];

export const getOperatingSystemImage = (vm: VMKind, templates: K8sResourceKind[]): string => {
  const templateName = vm.metadata.labels['vm.kubevirt.io/template'];
  const template = templates.find((t) => t.metadata.name === templateName);
  if (!template) {
    return '';
  }

  return getImageForIconClass(template.metadata.annotations.iconClass);
};

export const createVMOverviewItem = (vm: VMKind, vmi: VMIKind, resources: any): OverviewItem => {
  const obj: K8sResourceKind = {
    ...vm,
    apiVersion: apiVersionForModel(VirtualMachineModel),
    kind: VirtualMachineModel.kind,
  };
  const { visibleReplicationControllers } = getReplicationControllersForResource(obj, resources);
  const [current, previous] = visibleReplicationControllers;
  const buildConfigs = getBuildConfigsForResource(obj, resources);
  const services = getServicesForResource(obj, resources);
  const routes = getRoutesForServices(services, resources);
  const laucherPod = findVMIPod(vmi, resources.pods.data);
  const pods = laucherPod ? [laucherPod] : [];
  return {
    buildConfigs,
    current,
    obj,
    previous,
    pods,
    routes,
    services,
    isMonitorable: false,
    isOperatorBackedService: false,
  };
};

export const createVMOverviewItems = (resources: any): OverviewItem[] => {
  if (!resources.virtualmachines?.data.length) {
    return [];
  }

  return resources.virtualmachines.data.map((vm: any) => {
    const { name } = vm.metadata;
    const vmis = resources.virtualmachineinstances.data;
    const vmi = vmis.find((instance) => instance.metadata.name === name) as VMIKind;

    return createVMOverviewItem(vm, vmi, resources);
  });
};

const createTopologyVMNodeData = (
  vmOverview: OverviewItem,
  resources: TopologyDataResources,
): TopologyDataObject => {
  const vm = vmOverview.obj as VMKind;
  const { uid, name, labels } = vm.metadata;
  const vmis = resources.virtualmachineinstances.data;
  const vmi = vmis.find((instance) => instance.metadata.name === name) as VMIKind;
  const migrations = resources.migrations.data;

  const statusDetail = getVMStatus({ vm, vmi, pods: vmOverview.pods, migrations });

  return {
    id: uid,
    name: name || labels['app.kubernetes.io/instance'],
    type: TYPE_VIRTUAL_MACHINE,
    resources: vmOverview,
    operatorBackedService: false,
    data: {
      url: getRoutesURL(vmOverview),
      kind: referenceFor(vm),
      vmi,
      statusDetail,
      osImage: getOperatingSystemImage(vm as VMKind, resources.virtualmachinetemplates.data),
    },
  };
};

export const getKubevirtTopologyDataModel = (
  resources: TopologyDataResources,
  allResources: K8sResourceKind[],
  installedOperators,
  utils: Function[],
  transformBy: string[],
  serviceBindingRequests: K8sResourceKind[],
): TopologyDataModel => {
  const vmsDataModel: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };
  const vmsResources = [];

  if (resources.virtualmachines?.data.length) {
    const typedDataModel: TopologyDataModel = {
      graph: { nodes: [], edges: [], groups: [] },
      topology: {},
    };

    const vmOverviewItems = createVMOverviewItems(resources);
    vmOverviewItems.forEach((vmOverview: OverviewItem) => {
      const vm = vmOverview.obj;
      const { uid } = vm.metadata;
      vmsResources.push(uid);
      typedDataModel.topology[uid] = createTopologyVMNodeData(vmOverview, resources);
      typedDataModel.graph.nodes.push(getTopologyNodeItem(vm, TYPE_VIRTUAL_MACHINE));
      typedDataModel.graph.edges.push(
        ...getTopologyEdgeItems(vm, allResources, serviceBindingRequests),
      );
      mergeGroup(getTopologyGroupItems(vm), typedDataModel.graph.groups);
    });

    addToTopologyDataModel(typedDataModel, vmsDataModel);
  }

  return vmsDataModel;
};
