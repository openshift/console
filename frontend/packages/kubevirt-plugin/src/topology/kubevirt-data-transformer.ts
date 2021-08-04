import * as React from 'react';
import { Model } from '@patternfly/react-topology';
import { ExtensionHook } from '@console/dynamic-plugin-sdk';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { TemplateModel } from '@console/internal/models';
import {
  K8sResourceKind,
  PersistentVolumeClaimKind,
  PodKind,
  referenceFor,
  WatchK8sResources,
} from '@console/internal/module/k8s';
import { OverviewItem, useActiveNamespace } from '@console/shared';
import {
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
  WorkloadModelProps,
} from '@console/topology/src/data-transforms/transform-utils';
import { TopologyDataObject, TopologyDataResources } from '@console/topology/src/topology-types';
import * as models from '../models';
import {
  getKubevirtModelAvailableAPIVersion,
  kubevirtReferenceForModel,
} from '../models/kubevirtReferenceForModel';
import { getVMStatus } from '../statuses/vm/vm-status';
import { VMIKind, VMKind } from '../types';
import { V1alpha1DataVolume } from '../types/api';
import { VMImportKind } from '../types/vm-import/ovirt/vm-import';
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
    vm.apiVersion = getKubevirtModelAvailableAPIVersion(models.VirtualMachineModel);
  }
  if (!vm.kind) {
    vm.kind = models.VirtualMachineModel.kind;
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
        getTopologyNodeItem(resource, TYPE_VIRTUAL_MACHINE, data, WorkloadModelProps),
      );
      mergeGroup(getTopologyGroupItems(resource), vmsDataModel.nodes);
    });
  }

  return Promise.resolve(vmsDataModel);
};

export const useKubevirtResources: ExtensionHook<WatchK8sResources<any>> = () => {
  const [namespace] = useActiveNamespace();
  const resources = React.useMemo<[WatchK8sResources<any>, boolean, any]>(
    () => [
      {
        virtualmachines: {
          isList: true,
          kind: kubevirtReferenceForModel(models.VirtualMachineModel),
          namespace,
          optional: true,
        },
        virtualmachineinstances: {
          isList: true,
          kind: kubevirtReferenceForModel(models.VirtualMachineInstanceModel),
          namespace,
          optional: true,
        },
        virtualmachinetemplates: {
          isList: true,
          kind: TemplateModel.kind,
          selector: {
            matchLabels: { 'template.kubevirt.io/type': 'base' },
          },
          optional: true,
        },
        migrations: {
          isList: true,
          kind: kubevirtReferenceForModel(models.VirtualMachineInstanceMigrationModel),
          namespace,
          optional: true,
        },
        dataVolumes: {
          isList: true,
          optional: true,
          kind: kubevirtReferenceForModel(models.DataVolumeModel),
        },
        vmImports: {
          isList: true,
          optional: true,
          kind: kubevirtReferenceForModel(models.VirtualMachineImportModel),
        },
        pods: {
          isList: true,
          kind: 'Pod',
          namespace,
          optional: true,
        },
      },
      true,
      undefined,
    ],
    [namespace],
  );

  return resources;
};
