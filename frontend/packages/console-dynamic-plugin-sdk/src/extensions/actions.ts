import * as React from 'react';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';
import { ExtensionHook } from '../api/common-types';
import { AccessReviewResourceAttributes } from './console-internal-types';

namespace ExtensionProperties {
  export type ActionCreator = {
    /** ID used to identify the action creator. */
    id: string;
    /** The context ID helps to narrow the scope of contributed actions to a particular area of the application. Ex - topology, helm */
    contextId: string | 'resource';
    /** A react hook which creates and returns action for the given scope.
     * If contextId = `resource` then the scope will always be a K8s resource object
     * */
    creator: EncodedCodeRef;
  };

  export type ActionProvider = {
    /** The context ID helps to narrow the scope of contributed actions to a particular area of the application. Ex - topology, helm */
    contextId: string | 'resource';
    /** A react hook which returns action for the given scope.
     * If contextId = `resource` then the scope will always be a K8s resource object
     * */
    provider: EncodedCodeRef;
  };

  export type ResourceActionProvider = {
    /** The model for which this provider provides actions for. */
    model: {
      group: string;
      version?: string;
      kind?: string;
    };
    /** The action ids to contribute to */
    actions: string[];
  };

  export type ActionGroup = {
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
  };

  export type ActionFilter = {
    /** The context ID helps to narrow the scope of contributed actions to a particular area of the application. Ex - topology, helm */
    contextId: string | 'resource';
    /** A function which will filter actions based on some conditions.
     * scope: The scope in which actions should be provided for.
     * Note: hook may be required if we want to remove the ModifyCount action from a deployment with HPA
     * */
    filter: EncodedCodeRef;
  };

  export type ActionCreatorCodeRefs = {
    creator: CodeRef<ExtensionHook<Action>>;
  };

  export type ActionProviderCodeRefs = {
    provider: CodeRef<ExtensionHook<string[]>>;
  };

  export type ActionFilterCodeRefs = {
    filter: CodeRef<(scope: any, action: Action) => boolean>;
  };
}

export type ActionCreator = Extension<ExtensionProperties.ActionCreator> & {
  type: 'console.action/creator';
};

export type ActionProvider = Extension<ExtensionProperties.ActionProvider> & {
  type: 'console.action/provider';
};

export type ResourceActionProvider = Extension<ExtensionProperties.ResourceActionProvider> & {
  type: 'console.action/resource-provider';
};

export type ActionGroup = Extension<ExtensionProperties.ActionGroup> & {
  type: 'console.action/group';
};

export type ActionFilter = Extension<ExtensionProperties.ActionFilter> & {
  type: 'console.action/filter';
};

export type ResolvedActionCreator = UpdateExtensionProperties<
  ActionCreator,
  ExtensionProperties.ActionCreatorCodeRefs
>;

export type ResolvedActionProvider = UpdateExtensionProperties<
  ActionProvider,
  ExtensionProperties.ActionProviderCodeRefs
>;

export type ResolvedActionFilter = UpdateExtensionProperties<
  ActionFilter,
  ExtensionProperties.ActionFilterCodeRefs
>;

export const isActionCreator = (e: Extension): e is ResolvedActionCreator => {
  return e.type === 'console.action/creator';
};

export const iActionProvider = (e: Extension): e is ResolvedActionProvider => {
  return e.type === 'console.action/provider';
};

export const isResourceActionProvider = (e: Extension): e is ResourceActionProvider => {
  return e.type === 'console.action/resource-provider';
};

export const isActionGroup = (e: Extension): e is ActionGroup => {
  return e.type === 'console.action/group';
};

export const isActionFilter = (e: Extension): e is ResolvedActionFilter => {
  return e.type === 'console.action/filter';
};

export type Action = {
  /** A unique identifier for this action. */
  id: string;
  /** The label to display in the UI. */
  label: string;
  /** Executable callback or href.
   * External links should automatically provide an external link icon on action.
   * */
  cta: () => void | { href: string; external?: boolean };
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
  accessReview?: AccessReviewResourceAttributes[];
};
