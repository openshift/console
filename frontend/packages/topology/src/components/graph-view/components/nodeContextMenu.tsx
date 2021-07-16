import * as React from 'react';
import {
  ContextMenuItem,
  ContextSubMenuItem,
  Node,
  Graph,
  isGraph,
} from '@patternfly/react-topology';
import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk/src';
import {
  history,
  KebabItem,
  KebabOption,
  KebabMenuOption,
  kebabOptionsToMenu,
  isKebabSubMenu,
} from '@console/internal/components/utils';
import {
  getMenuOptionType,
  GroupedMenuOption,
  MenuOption,
  MenuOptionType,
  orderExtensionBasedOnInsertBeforeAndAfter,
} from '@console/shared';
import ActionMenuItem from '@console/shared/src/components/actions/menu/ActionMenuItem';
import { graphActions } from '../../../actions/graphActions';
import { groupActions } from '../../../actions/groupActions';
import { workloadActions } from '../../../actions/workloadActions';
import { TYPE_APPLICATION_GROUP } from '../../../const';
import { TopologyApplicationObject } from '../../../topology-types';
import { getResource, isOperatorBackedNode } from '../../../utils/topology-utils';

export const isWorkloadRegroupable = (node: Node): boolean =>
  isGraph(node?.getParent()) || node?.getParent().getType() === TYPE_APPLICATION_GROUP;

const onKebabOptionClick = (option: KebabOption) => {
  if (option.callback) {
    option.callback();
  }
  if (option.href) {
    history.push(option.href);
  }
};

export const createMenuItems = (actions: KebabMenuOption[]) =>
  actions.map((option: KebabMenuOption, index) =>
    isKebabSubMenu(option) ? (
      <ContextSubMenuItem
        label={option.labelKey ? i18next.t(option.labelKey) : option.label}
        key={option.labelKey || option.label}
      >
        {createMenuItems(option.children)}
      </ContextSubMenuItem>
    ) : (
      <ContextMenuItem
        key={index} // eslint-disable-line react/no-array-index-key
        component={<KebabItem option={option} onClick={() => onKebabOptionClick(option)} />}
      />
    ),
  );

export const createContextMenuItems = (actions: MenuOption[]) => {
  const sortedOptions = orderExtensionBasedOnInsertBeforeAndAfter(actions);
  return sortedOptions.map((option: MenuOption) => {
    const optionType = getMenuOptionType(option);
    switch (optionType) {
      case MenuOptionType.SUB_MENU:
        return (
          <ContextSubMenuItem label={option.label} key={option.id}>
            {createContextMenuItems((option as GroupedMenuOption).children)}
          </ContextSubMenuItem>
        );
      case MenuOptionType.GROUP_MENU:
        return (
          <>
            <div className="pf-c-dropdown__group-title">{option.label}</div>
            {createContextMenuItems((option as GroupedMenuOption).children)}
          </>
        );
      default:
        return (
          <ContextMenuItem
            key={option.id}
            component={
              <div className="pf-c-dropdown__menu-item">
                <ActionMenuItem action={option as Action} />
              </div>
            }
          />
        );
    }
  });
};

export const workloadContextMenu = (element: Node) =>
  createMenuItems(
    kebabOptionsToMenu(
      workloadActions(
        getResource(element),
        isWorkloadRegroupable(element),
        element.getData().resources,
        isOperatorBackedNode(element),
      ),
    ),
  );

export const noRegroupWorkloadContextMenu = (element: Node) =>
  createMenuItems(
    kebabOptionsToMenu(
      workloadActions(getResource(element), false, null, isOperatorBackedNode(element)),
    ),
  );

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

export const graphContextMenu = (graph: Graph, connectorSource?: Node) =>
  createMenuItems(kebabOptionsToMenu(graphActions(graph.getData(), connectorSource)));
