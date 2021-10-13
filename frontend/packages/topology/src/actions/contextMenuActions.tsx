import * as React from 'react';
import { Node, ContextSubMenuItem, ContextMenuItem } from '@patternfly/react-topology';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { referenceFor } from '@console/internal/module/k8s';
import {
  ActionServiceProvider,
  getMenuOptionType,
  GroupedMenuOption,
  MenuOption,
  MenuOptionType,
  orderExtensionBasedOnInsertBeforeAndAfter,
} from '@console/shared';
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
            {option.label && <h1 className="pf-c-dropdown__group-title">{option.label}</h1>}
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

export const contextMenuActions = (element: Node): React.ReactElement[] => {
  const resource = getResource(element);
  const context = {
    'topology-actions': element,
    ...(resource ? { [referenceFor(resource)]: resource } : {}),
  };
  return [
    <ActionServiceProvider key="topology" context={context}>
      {({ options, loaded }) => loaded && createContextMenuItems(options)}
    </ActionServiceProvider>,
  ];
};
