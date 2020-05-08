import * as React from 'react';
import { ContextMenuItem, ContextSubMenuItem, Node, Graph } from '@console/topology';
import {
  history,
  KebabItem,
  KebabOption,
  KebabMenuOption,
  kebabOptionsToMenu,
  isKebabSubMenu,
} from '@console/internal/components/utils';
import { workloadActions } from '../actions/workloadActions';
import { groupActions } from '../actions/groupActions';
import { nodeActions } from '../actions/nodeActions';
import { graphActions } from '../actions/graphActions';
import { TopologyApplicationObject } from '../topology-types';
import { regroupActions } from '../actions/regroupActions';

const onKebabOptionClick = (option: KebabOption) => {
  if (option.callback) {
    option.callback();
  }
  if (option.href) {
    history.push(option.href);
  }
};

export const createMenuItems = (actions: KebabMenuOption[]) =>
  actions.map((option) =>
    isKebabSubMenu(option) ? (
      <ContextSubMenuItem label={option.label} key={option.label}>
        {createMenuItems(option.children)}
      </ContextSubMenuItem>
    ) : (
      <ContextMenuItem
        key={option.label}
        component={<KebabItem option={option} onClick={() => onKebabOptionClick(option)} />}
      />
    ),
  );

export const workloadContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(workloadActions(element.getData())));

export const noRegroupWorkloadContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(workloadActions(element.getData(), false)));

export const groupContextMenu = (element: Node, connectorSource?: Node) => {
  const applicationData: TopologyApplicationObject = {
    id: element.getId(),
    name: element.getLabel(),
    resources: element.getData().groupResources,
  };

  const graphData = element.getGraph().getData();
  return createMenuItems(
    kebabOptionsToMenu(groupActions(graphData, applicationData, connectorSource)),
  );
};
export const nodeContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(nodeActions(element.getData())));

export const graphContextMenu = (graph: Graph, connectorSource?: Node) =>
  createMenuItems(kebabOptionsToMenu(graphActions(graph.getData(), connectorSource)));

export const regroupContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(regroupActions(element)));

export const regroupGroupContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(regroupActions(element, true)));
