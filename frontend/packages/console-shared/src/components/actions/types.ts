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

export type ActionService = {
  actions: Action[];
  options: MenuOption[];
  loaded: boolean;
  error: any;
};

/** Type from @console/dynamic-plugin-sdk/src/api/internal-types */
// Copied version to fix a warning because of an cycling dependency between console-shared and dynamic-plugin-sdk
export type ActionContext = {
  [contextId: string]: any;
};

/** Type from @console/dynamic-plugin-sdk/src/api/internal-types */
// Copied version to fix a warning because of an cycling dependency between console-shared and dynamic-plugin-sdk
export enum ActionMenuVariant {
  KEBAB = 'plain',
  DROPDOWN = 'default',
}
