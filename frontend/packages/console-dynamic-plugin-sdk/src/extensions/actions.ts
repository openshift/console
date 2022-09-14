import * as React from 'react';
import {
  ActionFilter as CoreActionFilter,
  ActionGroup as CoreActionGroup,
  ActionProvider as CoreActionProvider,
  ResourceActionProvider as CoreResourceActionProvider,
} from '@openshift/dynamic-plugin-sdk';
import { Extension, ExtensionDeclaration } from '../types';
import { AccessReviewResourceAttributes } from './console-types';

/** ActionProvider contributes a hook that returns list of actions for specific context */
export type ActionProvider = ExtensionDeclaration<
  'console.action/provider',
  CoreActionProvider['properties']
>;

/** ResourceActionProvider contributes a hook that returns list of actions for specific resource model */
export type ResourceActionProvider = ExtensionDeclaration<
  'console.action/resource-provider',
  CoreResourceActionProvider['properties']
>;

/** ActionGroup contributes an action group that can also be a submenu */
export type ActionGroup = ExtensionDeclaration<
  'console.action/group',
  {
    /** ID used to identify the action section. */
    id: string;
    /** The label to display in the UI.
     * Required for submenus.
     * */
    label?: string;
    /** Whether this group should be displayed as submenu */
    submenu?: boolean;
    /** Insert this item before the item referenced here.
     * For arrays, the first one found in order is used.
     * */
    insertBefore?: string | string[];
    /** Insert this item after the item referenced here.
     * For arrays, the first one found in order is used.
     * insertBefore takes precedence.
     * */
    insertAfter?: string | string[];
  }
>;

/** ActionGroup contributes an action group that can also be a submenu */
// DO NOT COMMIT
export type ActionGroup2 = ExtensionDeclaration<
  'console.action/group',
  CoreActionGroup['properties']
>;

/** ActionFilter can be used to filter an action */
export type ActionFilter = ExtensionDeclaration<
  'console.action/filter',
  CoreActionFilter['properties']
>;

export type SupportedActionExtensions =
  | ActionProvider
  | ResourceActionProvider
  | ActionGroup
  | ActionFilter;

// Type Guards

export const isActionProvider = (e: Extension): e is ActionProvider => {
  return e.type === 'console.action/provider';
};

export const isResourceActionProvider = (e: Extension): e is ResourceActionProvider => {
  return e.type === 'console.action/resource-provider';
};

export const isActionGroup = (e: Extension): e is ActionGroup => {
  return e.type === 'console.action/group';
};

export const isActionFilter = (e: Extension): e is ActionFilter => {
  return e.type === 'console.action/filter';
};

// Support types

export type Action = {
  /** A unique identifier for this action. */
  id: string;
  /** The label to display in the UI. */
  label: React.ReactNode;
  /** Subtext for the menu item */
  description?: string;
  /** Executable callback or href.
   * External links should automatically provide an external link icon on action.
   * */
  cta: (() => void) | { href: string; external?: boolean };
  /** Whether the action is disabled. */
  disabled?: boolean;
  /** The tooltip for this action. */
  tooltip?: string;
  /** The disabled tooltip for this action. */
  disabledTooltip?: string;
  /** The icon for this action. */
  icon?: string | React.ReactNode;
  /** A `/` separated string where each segment denotes
   * Eg. `add-to-project`, `menu-1/menu-2`
   * */
  path?: string;
  /** Insert this item before the item referenced here.
   * For arrays, the first one found in order is used.
   * */
  insertBefore?: string | string[];
  /** Insert this item after the item referenced here.
   * For arrays, the first one found in order is used.
   * insertBefore takes precedence.
   * */
  insertAfter?: string | string[];
  /** Describes the access check to perform. */
  accessReview?: AccessReviewResourceAttributes;
};
