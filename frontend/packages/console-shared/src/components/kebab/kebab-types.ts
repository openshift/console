import { Action } from '@console/dynamic-plugin-sdk';

export type KebabMenuOption = KebabSubMenuOption | Action;

export type KebabSubMenuOption = {
  id: string;
  label?: string;
  children: KebabMenuOption[];
};
