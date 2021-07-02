import { Action, ActionGroup } from '@console/dynamic-plugin-sdk';

export type MenuOption = Action | GroupedMenuOption;

export type GroupedMenuOption = ActionGroup['properties'] & {
  children?: MenuOption[];
};

export enum MenuOptionType {
  GROUP_MENU,
  SUB_MENU,
  ATOMIC_MENU,
}

export enum ActionMenuVariant {
  KEBAB = 'plain',
  DROPDOWN = 'default',
}
