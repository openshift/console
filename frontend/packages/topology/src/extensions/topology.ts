import { TopologyQuadrant } from '@patternfly/react-topology';
import { WatchK8sResources } from '@console/dynamic-plugin-sdk';
import { CodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import {
  TopologyApplyDisplayOptions,
  TopologyDataModelDepicted,
  TopologyDataModelGetter,
  TopologyDisplayOption,
  ViewComponentFactory,
  TopologyDataModelReconciler,
  TopologyDecoratorGetter,
} from '../topology-types';

namespace ExtensionProperties {
  export interface TopologyComponentFactory {
    /** Getter for a ViewComponentFactory */
    getFactory: CodeRef<ViewComponentFactory>;
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
    getDataModel?: CodeRef<TopologyDataModelGetter>;
    /** Getter for function to determine if a resource is depicted by this model factory */
    isResourceDepicted?: CodeRef<TopologyDataModelDepicted>;
    /** Getter for function to reconcile data model after all extensions' models have loaded */
    getDataModelReconciler?: CodeRef<TopologyDataModelReconciler>;
  }

  export interface TopologyDisplayFilters {
    // Getter for topology filters specific to the extension
    getTopologyFilters: CodeRef<() => TopologyDisplayOption[]>;
    // Function to apply filters to the model
    applyDisplayOptions: CodeRef<TopologyApplyDisplayOptions>;
  }

  export interface TopologyDecoratorProvider {
    id: string;
    priority: number;
    quadrant: TopologyQuadrant;
    decorator: CodeRef<TopologyDecoratorGetter>;
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

export interface TopologyDisplayFilters
  extends Extension<ExtensionProperties.TopologyDisplayFilters> {
  type: 'Topology/DisplayFilters';
}

export interface TopologyDecoratorProvider
  extends Extension<ExtensionProperties.TopologyDecoratorProvider> {
  type: 'Topology/Decorator';
}

export const isTopologyComponentFactory = (e: Extension): e is TopologyComponentFactory => {
  return e.type === 'Topology/ComponentFactory';
};

export const isTopologyDataModelFactory = (e: Extension): e is TopologyDataModelFactory => {
  return e.type === 'Topology/DataModelFactory';
};

export const isTopologyDisplayFilters = (e: Extension): e is TopologyDisplayFilters => {
  return e.type === 'Topology/DisplayFilters';
};

export const isTopologyDecoratorProvider = (e: Extension): e is TopologyDecoratorProvider => {
  return e.type === 'Topology/Decorator';
};
