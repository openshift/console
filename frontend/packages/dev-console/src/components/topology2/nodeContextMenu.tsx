import * as React from 'react';
import { ContextMenuItem, GraphElement, Node } from '@console/topology';
import { history, KebabItem, KebabOption } from '@console/internal/components/utils';
import { workloadActions } from '../topology/actions/workloadActions';
import { groupActions } from '../topology/actions/groupActions';
import { TopologyApplicationObject } from '../topology/topology-types';

const onKebabOptionClick = (option: KebabOption) => {
  if (option.callback) {
    option.callback();
  }
  if (option.href) {
    history.push(option.href);
  }
};

const ceateMenuItem = (action: KebabOption) => (
  <ContextMenuItem
    className="odc2-topology-context-menu__kebab-wrapper"
    key={action.label}
    onClick={() => onKebabOptionClick(action)}
  >
    <KebabItem option={action} onClick={null} />
  </ContextMenuItem>
);

const createMenuItems = (actions: KebabOption[]) =>
  actions.filter((o) => !o.hidden).map(ceateMenuItem);

const workloadContextMenu = (element: Node) => createMenuItems(workloadActions(element.getData()));

const groupContextMenu = (element: Node) => {
  const applicationData: TopologyApplicationObject = {
    id: element.getId(),
    name: element.getLabel(),
    resources: element.getChildren().map((node: GraphElement) => node.getData()),
  };

  return createMenuItems(groupActions(applicationData));
};

export { workloadContextMenu, groupContextMenu };
