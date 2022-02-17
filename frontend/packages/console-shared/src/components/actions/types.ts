import { Action, ActionGroup } from '@console/dynamic-plugin-sdk';

export {
  ActionContext,
  ActionMenuVariant,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';

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
