import { Extension } from '@console/plugin-sdk/src/typings/base';
import { ComponentFactory } from '@console/topology';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import {
  TopologyApplyDisplayOptions,
  TopologyDataModelDepicted,
  TopologyDataModelGetter,
  TopologyDisplayOption,
  CreateConnectionGetter,
} from '../components/topology';

namespace ExtensionProperties {
  export interface TopologyComponentFactory {
    /** Getter for a ComponentFactory */
    getFactory: () => Promise<ComponentFactory>;
  }

  export interface TopologyDataModelFactory {
    /** Unique ID for the factory. */
    id: string;
    /** Priority for the factory */
    priority: number;
    /** Resources to be fetched from useK8sWatchResources hook. */
    resources?: (namespace: string) => WatchK8sResources<any>;
    /** Keys in resources containing workloads. */
    workloadKeys?: string[];
    /** Getter for the data model factory */
    getDataModel: () => Promise<TopologyDataModelGetter>;
    /** Getter for function to determine if a resource is depicted by this model factory */
    isResourceDepicted: () => Promise<TopologyDataModelDepicted>;
  }

  export interface TopologyCreateConnector {
    /** Getter for the create connector function */
    getCreateConnector: () => Promise<CreateConnectionGetter>;
  }

  export interface TopologyDisplayFilters {
    // Getter for topology filters specific to the extension
    getTopologyFilters: () => Promise<() => TopologyDisplayOption[]>;
    // Function to apply filters to the model
    applyDisplayOptions: () => Promise<TopologyApplyDisplayOptions>;
  }
}

export interface TopologyComponentFactory
  extends Extension<ExtensionProperties.TopologyComponentFactory> {
  type: 'Topology/ComponentFactory';
}

export interface TopologyDataModelFactory
  extends Extension<ExtensionProperties.TopologyDataModelFactory> {
  type: 'Topology/DataModelFactory';
}

export interface TopologyCreateConnector
  extends Extension<ExtensionProperties.TopologyCreateConnector> {
  type: 'Topology/CreateConnector';
}

export interface TopologyDisplayFilters
  extends Extension<ExtensionProperties.TopologyDisplayFilters> {
  type: 'Topology/DisplayFilters';
}

export const isTopologyComponentFactory = (e: Extension): e is TopologyComponentFactory => {
  return e.type === 'Topology/ComponentFactory';
};

export const isTopologyDataModelFactory = (e: Extension): e is TopologyDataModelFactory => {
  return e.type === 'Topology/DataModelFactory';
};

export const isTopologyCreateConnector = (e: Extension): e is TopologyCreateConnector => {
  return e.type === 'Topology/CreateConnector';
};

export const isTopologyDisplayFilter = (e: Extension): e is TopologyDisplayFilters => {
  return e.type === 'Topology/DisplayFilters';
};
