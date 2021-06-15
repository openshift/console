import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { TemplateModel } from '@console/internal/models';
import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
} from '@console/topology/src/extensions';
import * as models from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import {
  getIsKubevirtResource,
  getKubevirtComponentFactory,
  getKubevirtTopologyDataModel,
} from './index';

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyDisplayFilters;

const virtualMachineResourceWatchers = (namespace: string): WatchK8sResources<any> => ({
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
});

export const getTopologyPlugin = (required: string[]): Plugin<TopologyConsumedExtensions> => [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: applyCodeRefSymbol(getKubevirtComponentFactory),
    },
    flags: {
      required,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'kubevirt-topology-model-factory',
      priority: 200,
      resources: virtualMachineResourceWatchers,
      workloadKeys: ['virtualmachines'],
      getDataModel: applyCodeRefSymbol(getKubevirtTopologyDataModel),
      isResourceDepicted: applyCodeRefSymbol(getIsKubevirtResource),
    },
    flags: {
      required,
    },
  },
];
