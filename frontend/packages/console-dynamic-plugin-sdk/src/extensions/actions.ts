import * as React from 'react';
import {
  ActionFilter as CoreActionFilter,
  ActionGroup as CoreActionGroup,
  ActionProvider as CoreActionProvider,
  ResourceActionProvider as CoreResourceActionProvider,
} from '@openshift/dynamic-plugin-sdk';
import { Extension } from '../types';
import { AccessReviewResourceAttributes } from './console-types';
import { RepackageExtension } from './data-types';

/** ActionProvider contributes a hook that returns list of actions for specific context */
export type ActionProvider = RepackageExtension<'console.action/provider', CoreActionProvider>;

/** ResourceActionProvider contributes a hook that returns list of actions for specific resource model */
export type ResourceActionProvider = RepackageExtension<
  'console.action/resource-provider',
  CoreResourceActionProvider
>;

/** ActionGroup contributes an action group that can also be a submenu */
export type ActionGroup = RepackageExtension<'console.action/group', CoreActionGroup>;

/** ActionFilter can be used to filter an action */
export type ActionFilter = RepackageExtension<'console.action/filter', CoreActionFilter>;

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
/**
 * TODO: pull from Core SDK
 * e.g., export type Action = CoreAction;
 * once Action has been exported in Core SDK
 */
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
  tooltip?: string | React.ReactNode;
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
