import { Action, ActionGroup } from '@console/dynamic-plugin-sdk';
import { ActionContext as ActionContextType } from '@console/dynamic-plugin-sdk/src/api/internal-types';

export { ActionMenuVariant } from '@console/dynamic-plugin-sdk/src/api/internal-types';

export type ActionContext = ActionContextType;

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
