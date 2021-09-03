import * as React from 'react';
import { Node, ContextSubMenuItem, ContextMenuItem } from '@patternfly/react-topology';
import { Action } from '@console/dynamic-plugin-sdk/src';
import {
  ActionServiceProvider,
  getMenuOptionType,
  GroupedMenuOption,
  MenuOption,
  MenuOptionType,
  orderExtensionBasedOnInsertBeforeAndAfter,
} from '@console/shared';
import ActionMenuItem from '@console/shared/src/components/actions/menu/ActionMenuItem';

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
  return [
    <ActionServiceProvider key="topology" context={{ 'topology-actions': element }}>
      {({ options, loaded }) => loaded && createContextMenuItems(options)}
    </ActionServiceProvider>,
  ];
};
