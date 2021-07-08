import { Action, ActionGroup } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk';
import { GroupedMenuOption, MenuOption, MenuOptionType } from './menu-types';

export const createMenuOptions = (
  actions: Action[],
  groupExtensions: LoadedExtension<ActionGroup>[],
): MenuOption[] => {
  const menuOptions = [];

  // Default menu groups $top and $bottom.
  const topGroup = {
    id: '$top',
    children: [],
  };
  const bottomGroup = {
    id: '$bottom',
    children: [],
  };

  const submenus = {
    [topGroup.id]: topGroup,
    [bottomGroup.id]: bottomGroup,
  };
  const groups = [topGroup, ...groupExtensions.map((group) => group.properties), bottomGroup];

  actions.forEach((action) => {
    if (!action.disabled) {
      if (action.path) {
        const parts = action.path.split('/');
        parts.forEach((part, index) => {
          let subMenu = submenus[part];
          const partGroup = groups.find((group) => group.id === part);
          if (partGroup && !submenus[part]) {
            subMenu = { ...partGroup, children: [] };
            submenus[part] = subMenu;
            if (index === 0) {
              menuOptions.push(subMenu);
            } else {
              submenus[parts[index - 1]].children.push(subMenu);
            }
          }
        });
        submenus[parts[parts.length - 1]].children.push(action);
      } else {
        menuOptions.push(action);
      }
    }
  });

  if (topGroup.children.length > 0) menuOptions.unshift(topGroup);
  if (bottomGroup.children.length > 0) menuOptions.push(bottomGroup);

  return menuOptions;
};

export const getMenuOptionType = (option: MenuOption) => {
  // a grouped menu has children
  const isGroupMenu = Array.isArray((option as GroupedMenuOption).children);
  // a submenu menu has children and submenu property true
  const isSubMenu = isGroupMenu && (option as GroupedMenuOption).submenu;

  if (isSubMenu) {
    return MenuOptionType.SUB_MENU;
  }

  if (isGroupMenu) {
    return MenuOptionType.GROUP_MENU;
  }

  return MenuOptionType.ATOMIC_MENU;
};
