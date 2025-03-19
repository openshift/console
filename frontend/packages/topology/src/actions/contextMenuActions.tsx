import * as React from 'react';
import { Title } from '@patternfly/react-core';
import { Node, ContextSubMenuItem, ContextMenuItem, Graph } from '@patternfly/react-topology';
import {
  Action,
  GroupedMenuOption,
  MenuOption,
  MenuOptionType,
} from '@console/dynamic-plugin-sdk/src';
import { ContextMenuActions } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { referenceFor } from '@console/internal/module/k8s';
import { getMenuOptionType, orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';
import ActionMenuItem from '@console/shared/src/components/actions/menu/ActionMenuItem';
import { getResource } from '../utils';

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
          <React.Fragment key={option.id}>
            {option.label && (
              <Title headingLevel="h1" className="pf-v6-c-dropdown__group-title">
                {option.label}
              </Title>
            )}
            {createContextMenuItems((option as GroupedMenuOption).children)}
          </React.Fragment>
        );
      default:
        return (
          <ActionMenuItem key={option.id} action={option as Action} component={ContextMenuItem} />
        );
    }
  });
};

export const graphActionContext = (graph: Graph, connectorSource?: Node) => ({
  'topology-context-actions': { element: graph, connectorSource },
});

export const groupActionContext = (element: Node, connectorSource?: Node) => ({
  'topology-context-actions': { element, connectorSource },
});

export const contextMenuActions: ContextMenuActions = (element) => {
  const resource = getResource(element);
  const { csvName } = element.getData()?.data ?? {};
  return {
    'topology-actions': element,
    ...(resource ? { [referenceFor(resource)]: resource } : {}),
    ...(csvName ? { 'csv-actions': { csvName, resource } } : {}),
  };
};
