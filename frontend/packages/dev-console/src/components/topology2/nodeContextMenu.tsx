import * as React from 'react';
import { ContextMenuItem, GraphElement, Node } from '@console/topology';
import { history, KebabItem, KebabOption } from '@console/internal/components/utils';
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

const createMenuItems = (actions: KebabOption[]) =>
  actions
    .filter((o) => !o.hidden)
    .map((option) => (
      <ContextMenuItem
        key={option.label}
        component={<KebabItem option={option} onClick={() => onKebabOptionClick(option)} />}
      />
    ));

const workloadContextMenu = (element: Node) => createMenuItems(workloadActions(element.getData()));

const groupContextMenu = (element: Node) => {
  const applicationData: TopologyApplicationObject = {
    id: element.getId(),
    name: element.getLabel(),
    resources: element.getChildren().map((node: GraphElement) => node.getData()),
  };

  return createMenuItems(groupActions(applicationData));
};

const nodeContextMenu = (element: Node) => createMenuItems(nodeActions(element.getData()));

export { workloadContextMenu, groupContextMenu, nodeContextMenu };
