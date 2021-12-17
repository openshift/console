import * as React from 'react';
import { CodeRef, Extension, ExtensionDeclaration } from '../types';

/** Adds a new inventory item into cluster overview page. */
export type ClusterOverviewInventoryItem = ExtensionDeclaration<
  'console.cluster-overview/inventory-item',
  {
    /** The component to be rendered. */
    component: CodeRef<React.ComponentType>;
  }
>;

// Type guards

export const isClusterOverviewInventoryItem = (e: Extension): e is ClusterOverviewInventoryItem =>
  e.type === 'console.cluster-overview/inventory-item';
