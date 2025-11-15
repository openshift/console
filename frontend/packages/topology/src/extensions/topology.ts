import { TopologyQuadrant } from '@patternfly/react-topology';
import { CodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import {
  TopologyApplyDisplayOptions,
  TopologyDisplayOption,
  ViewComponentFactory,
  TopologyDecoratorGetter,
} from '../topology-types';

namespace ExtensionProperties {
  export interface TopologyComponentFactory {
    /** Getter for a ViewComponentFactory */
    getFactory: CodeRef<ViewComponentFactory>;
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

export const isTopologyDisplayFilters = (e: Extension): e is TopologyDisplayFilters => {
  return e.type === 'Topology/DisplayFilters';
};

export const isTopologyDecoratorProvider = (e: Extension): e is TopologyDecoratorProvider => {
  return e.type === 'Topology/Decorator';
};
