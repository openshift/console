import { Model, NodeShape } from '@patternfly/react-topology/dist/esm/types';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  K8sResourceKind,
  PersistentVolumeClaimKind,
  PodKind,
  referenceFor,
} from '@console/internal/module/k8s';
import { OverviewItem, WORKLOAD_TYPES } from '@console/shared';
import {
  getTopologyEdgeItems,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
  WorkloadModelProps,
} from '@console/topology/src/data-transforms/transform-utils';
import { TopologyDataObject, TopologyDataResources } from '@console/topology/src/topology-types';
import { VirtualMachineModel } from '../kubevirt-dependencies/models';
import { getKubevirtModelAvailableAPIVersion } from '../kubevirt-dependencies/models/kubevirtReferenceForModel';
import { V1alpha1DataVolume } from '../kubevirt-dependencies/types/api';
import { VMKind } from '../kubevirt-dependencies/types/vm';
import { VMImportKind } from '../kubevirt-dependencies/types/vm-import';
import { VMIKind } from '../kubevirt-dependencies/types/vmi';
import { getVMStatus } from '../kubevirt-dependencies/utils/statuses/vm-status';
import { TYPE_VIRTUAL_MACHINE } from './components/const';
import { VMNodeData } from './types';

export const getOperatingSystemImage = (vm: VMKind, templates: K8sResourceKind[]): string => {
  const templateName = vm.metadata?.labels?.['vm.kubevirt.io/template'];
  const template = templateName && templates.find((t) => t.metadata.name === templateName);
  if (!template) {
    return '';
  }

  return getImageForIconClass(template.metadata.annotations.iconClass);
};

export const createVMOverviewItem = (vm: K8sResourceKind): OverviewItem => {
  if (!vm.apiVersion) {
    vm.apiVersion = getKubevirtModelAvailableAPIVersion(VirtualMachineModel);
  }
  if (!vm.kind) {
    vm.kind = VirtualMachineModel.kind;
  }

  return {
    obj: vm,
    isMonitorable: false,
    isOperatorBackedService: false,
  };
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
      const vmOverview = createVMOverviewItem(resource);
      const { uid } = resource.metadata;
      vmsResources.push(uid);
      const data = createTopologyVMNodeData(resource, vmOverview, resources);
      vmsDataModel.nodes.push(
        getTopologyNodeItem(
          resource,
          TYPE_VIRTUAL_MACHINE,
          data,
          WorkloadModelProps,
          undefined,
          undefined,
          NodeShape.rect,
        ),
      );
      vmsDataModel.edges.push(...getTopologyEdgeItems(resource, resources.virtualmachines.data));
      WORKLOAD_TYPES.forEach((workload) => {
        vmsDataModel.edges.push(...getTopologyEdgeItems(resource, resources[workload]?.data)); // create visual connector from all WORKLOAD_TYPES to VMs
      });
      mergeGroup(getTopologyGroupItems(resource), vmsDataModel.nodes);
    });

    WORKLOAD_TYPES.forEach((resource) => {
      resources[resource]?.data?.forEach((d) => {
        vmsDataModel.edges.push(...getTopologyEdgeItems(d, resources.virtualmachines.data)); // create visual connector from VMs to all WORKLOAD_TYPES
      });
    });
  }

  return Promise.resolve(vmsDataModel);
};
