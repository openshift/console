import * as React from 'react';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { ExtensionHook, ExtensionK8sGroupModel } from '../api/common-types';
import { ExtensionDeclaration, CodeRef } from '../types';
import { AccessReviewResourceAttributes } from './console-types';

/** ActionProvider contributes a hook that returns list of actions for specific context */
export type ActionProvider = ExtensionDeclaration<
  'console.action/provider',
  {
    /** The context ID helps to narrow the scope of contributed actions to a particular area of the application. Ex - topology, helm */
    contextId: string | 'resource';
    /** A react hook which returns actions for the given scope.
     * If contextId = `resource` then the scope will always be a K8s resource object
     * */
    provider: CodeRef<ExtensionHook<Action[]>>;
  }
>;

/** ResourceActionProvider contributes a hook that returns list of actions for specific resource model */
export type ResourceActionProvider = ExtensionDeclaration<
  'console.action/resource-provider',
  {
    /** The model for which this provider provides actions for. */
    model: ExtensionK8sGroupModel;
    /** A react hook which returns actions for the given resource model */
    provider: CodeRef<ExtensionHook<Action[]>>;
  }
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

/** ActionFilter can be used to filter an action */
export type ActionFilter = ExtensionDeclaration<
  'console.action/filter',
  {
    /** The context ID helps to narrow the scope of contributed actions to a particular area of the application. Ex - topology, helm */
    contextId: string | 'resource';
    /** A function which will filter actions based on some conditions.
     * scope: The scope in which actions should be provided for.
     * Note: hook may be required if we want to remove the ModifyCount action from a deployment with HPA
     * */
    filter: CodeRef<(scope: any, action: Action) => boolean>;
  }
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
  label: string;
  /** Executable callback or href.
   * External links should automatically provide an external link icon on action.
   * */
  cta: (() => void) | { href: string; external?: boolean };
  /** Whether the action is disabled. */
  disabled?: boolean;
  /** The tooltip for this action. */
  tooltip?: string;
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
