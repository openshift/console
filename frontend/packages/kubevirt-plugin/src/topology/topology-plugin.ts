import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
} from '@console/dev-console/src/extensions/topology';
import { TemplateModel } from '@console/internal/models';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import * as models from '../models';
import {
  getIsKubevirtResource,
  getKubevirtComponentFactory,
  getKubevirtTopologyDataModel,
  applyDisplayOptions,
  getTopologyFilters,
} from './index';

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyDisplayFilters;

const virtualMachineResourceWatchers = (namespace: string): WatchK8sResources<any> => ({
  virtualmachines: {
    isList: true,
    kind: models.VirtualMachineModel.kind,
    namespace,
    optional: true,
  },
  virtualmachineinstances: {
    isList: true,
    kind: models.VirtualMachineInstanceModel.kind,
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
    kind: models.VirtualMachineInstanceMigrationModel.kind,
    namespace,
    optional: true,
  },
  dataVolumes: {
    isList: true,
    optional: true,
    kind: models.DataVolumeModel.kind,
  },
  vmImports: {
    isList: true,
    optional: true,
    kind: models.VirtualMachineImportModel.kind,
  },
});

export const getTopologyPlugin = (required: string[]): Plugin<TopologyConsumedExtensions> => [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: getKubevirtComponentFactory,
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
      getDataModel: getKubevirtTopologyDataModel,
      isResourceDepicted: getIsKubevirtResource,
    },
    flags: {
      required,
    },
  },
  {
    type: 'Topology/DisplayFilters',
    properties: {
      getTopologyFilters,
      applyDisplayOptions,
    },
    flags: {
      required,
    },
  },
];
