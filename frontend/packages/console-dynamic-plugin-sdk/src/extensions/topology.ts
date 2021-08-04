import { ExtensionHook } from '../api/common-types';
import {
  CreateConnectionGetter,
  RelationshipProviderCreate,
  RelationshipProviderProvides,
  TopologyApplyDisplayOptions,
  TopologyDataModelDepicted,
  TopologyDataModelGetter,
  TopologyDataModelReconciler,
  TopologyDecoratorGetter,
  TopologyDecoratorQuadrant,
  TopologyDisplayOption,
  ViewComponentFactory,
} from '../api/topology-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { WatchK8sResources } from './console-types';

/** Getter for a ViewComponentFactory */
export type TopologyComponentFactory = ExtensionDeclaration<
  'console.topology/component/factory',
  {
    /** Getter for a ViewComponentFactory */
    getFactory: CodeRef<ViewComponentFactory>;
  }
>;

/** Getter for the create connector function */
export type TopologyCreateConnector = ExtensionDeclaration<
  'console.topology/create/connector',
  {
    /** Getter for the create connector function */
    getCreateConnector: CodeRef<CreateConnectionGetter>;
  }
>;

/** Topology Data Model Factory Extension */
export type TopologyDataModelFactory = ExtensionDeclaration<
  'console.topology/data/factory',
  {
    /** Unique ID for the factory. */
    id: string;
    /** Priority for the factory */
    priority: number;
    /** React hook that returns resources to watch with useK8sWatchResources */
    resources?: CodeRef<ExtensionHook<WatchK8sResources<any>>>;
    /** Keys in resources containing workloads. */
    workloadKeys?: string[];
    /** Getter for the data model factory */
    getDataModel?: CodeRef<TopologyDataModelGetter>;
    /** Getter for function to determine if a resource is depicted by this model factory */
    isResourceDepicted?: CodeRef<TopologyDataModelDepicted>;
    /** Getter for function to reconcile data model after all extensions' models have loaded */
    getDataModelReconciler?: CodeRef<TopologyDataModelReconciler>;
  }
>;

/** Topology Display Filters Extension */
export type TopologyDisplayFilters = ExtensionDeclaration<
  'console.topology/display/filters',
  {
    // Getter for topology filters specific to the extension
    getTopologyFilters: CodeRef<() => TopologyDisplayOption[]>;
    // Function to apply filters to the model
    applyDisplayOptions: CodeRef<TopologyApplyDisplayOptions>;
  }
>;

/** Topology Decorator Provider Extension */
export type TopologyDecoratorProvider = ExtensionDeclaration<
  'console.topology/decorator/provider',
  {
    // id for topology decorator specific to the extension
    id: string;
    // priority for topology decorator specific to the extension
    priority: number;
    // quadrant for topology decorator specific to the extension
    quadrant: TopologyDecoratorQuadrant;
    // decorator specific to the extension
    decorator: CodeRef<TopologyDecoratorGetter>;
  }
>;

/** Topology relationship provider connector extension */
export type TopologyRelationshipProvider = ExtensionDeclaration<
  'console.topology/relationship/provider',
  {
    // use to determine if a connection can be created between the source and target node
    provides: CodeRef<RelationshipProviderProvides>;
    // tooltip to show when connector operation is hovering over the drop target ex: "Create a Visual Connector"
    tooltip: string;
    // callback to execute when connector is drop over target node to create a connection
    create: CodeRef<RelationshipProviderCreate>;
    // priority for relationship, higher will be preferred in case of multiple
    priority: number;
  }
>;

// Type Guards

export const isTopologyComponentFactory = (e: Extension): e is TopologyComponentFactory =>
  e.type === 'console.topology/component/factory';

export const isTopologyCreateConnector = (e: Extension): e is TopologyCreateConnector =>
  e.type === 'console.topology/create/connector';

export const isTopologyDataModelFactory = (e: Extension): e is TopologyDataModelFactory =>
  e.type === 'console.topology/data/factory';

export const isTopologyDisplayFilters = (e: Extension): e is TopologyDisplayFilters =>
  e.type === 'console.topology/display/filters';

export const isTopologyDecoratorProvider = (e: Extension): e is TopologyDecoratorProvider =>
  e.type === 'console.topology/decorator/provider';

export const isTopologyRelationshipProvider = (e: Extension): e is TopologyRelationshipProvider =>
  e.type === 'console.topology/relationship/provider';
