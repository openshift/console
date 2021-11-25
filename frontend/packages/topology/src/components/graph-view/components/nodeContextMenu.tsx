import * as React from 'react';
import { Node, Graph, isGraph } from '@patternfly/react-topology';
import { TYPE_APPLICATION_GROUP } from '@console/topology/src/const';
import { ActionServiceProvider } from '@console/shared';
import { createContextMenuItems } from '../../../actions/contextMenuActions';

export const isWorkloadRegroupable = (node: Node): boolean =>
  isGraph(node?.getParent()) || node?.getParent().getType() === TYPE_APPLICATION_GROUP;

export const groupContextMenu = (element: Node, connectorSource?: Node) => [
  <ActionServiceProvider
    key="topology"
    context={{ 'topology-context-actions': { element, connectorSource } }}
  >
    {({ options, loaded }) => loaded && createContextMenuItems(options)}
  </ActionServiceProvider>,
];

export const graphContextMenu = (graph: Graph, connectorSource?: Node) => [
  <ActionServiceProvider
    key="topology"
    context={{ 'topology-context-actions': { element: graph, connectorSource } }}
  >
    {({ options, loaded }) => loaded && createContextMenuItems(options)}
  </ActionServiceProvider>,
];
