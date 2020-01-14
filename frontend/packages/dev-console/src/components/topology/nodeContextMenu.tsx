import * as React from 'react';
import { ContextMenuItem, ContextSubMenuItem, GraphElement, Node } from '@console/topology';
import {
  history,
  KebabItem,
  KebabOption,
  KebabMenuOption,
  kebabOptionsToMenu,
  isKebabSubMenu,
} from '@console/internal/components/utils';
import { workloadActions } from './actions/workloadActions';
import { groupActions } from './actions/groupActions';
import { nodeActions } from './actions/nodeActions';
import { TopologyApplicationObject } from './topology-types';

const onKebabOptionClick = (option: KebabOption) => {
  if (option.callback) {
    option.callback();
  }
  if (option.href) {
    history.push(option.href);
  }
};

const createMenuItems = (actions: KebabMenuOption[]) =>
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

const workloadContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(workloadActions(element.getData())));

const groupContextMenu = (element: Node) => {
  const applicationData: TopologyApplicationObject = {
    id: element.getId(),
    name: element.getLabel(),
    resources: element.getChildren().map((node: GraphElement) => node.getData()),
  };

  return createMenuItems(kebabOptionsToMenu(groupActions(applicationData)));
};

const nodeContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(nodeActions(element.getData())));

export { workloadContextMenu, groupContextMenu, nodeContextMenu };
