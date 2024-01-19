import * as React from 'react';
import { CodeRef, Extension, ExtensionDeclaration } from '../types';
import { NodeKind, ResourcesObject, WatchK8sResources, WatchK8sResults } from './console-types';

export type IsNodeStatusActive<T extends ResourcesObject> = (
  node: NodeKind,
  resources: WatchK8sResults<T>,
) => boolean;

export type NodePopoverContentProps<T extends ResourcesObject> = {
  node: NodeKind;
  resources: WatchK8sResults<T>;
};

/** This extension can be used to add additional states to Node resource. */
export type NodeStatus<T extends ResourcesObject = ResourcesObject> = ExtensionDeclaration<
  'console.node/status',
  {
    /** Returns true if the additional state is active */
    isActive: CodeRef<IsNodeStatusActive<T>>;
    /** React component that will be rendered in status popover */
    PopoverContent: CodeRef<React.ComponentType<NodePopoverContentProps<T>>>;
    /** Title of the additional Node state */
    title: string;
    /** Additional resources that are needed to determine the additional state */
    resources?: WatchK8sResources<T>;
  }
>;

export const isNodeStatus = (e: Extension): e is NodeStatus => e.type === 'console.node/status';
