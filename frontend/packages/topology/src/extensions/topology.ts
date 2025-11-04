import { WatchK8sResources } from '@console/dynamic-plugin-sdk';
import {
  TopologyDataModelDepicted,
  TopologyDataModelGetter,
  TopologyDataModelReconciler,
} from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { CodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { Extension } from '@console/plugin-sdk/src/typings/base';

namespace ExtensionProperties {
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
}

export interface TopologyDataModelFactory
  extends Extension<ExtensionProperties.TopologyDataModelFactory> {
  type: 'Topology/DataModelFactory';
}

export const isTopologyDataModelFactory = (e: Extension): e is TopologyDataModelFactory => {
  return e.type === 'Topology/DataModelFactory';
};
