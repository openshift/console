import * as React from 'react';
import { ExtensionHook, ExtensionK8sKindVersionModel } from '../api/common-types';
import { ActionContext } from '../api/internal-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { AccessReviewResourceAttributes } from './console-types';

/**
 * ActionProvider contributes a hook that returns list of actions for specific context.
 *
 * This extension allows plugins to contribute context-sensitive actions (buttons, menu items)
 * that appear in various parts of the Console UI. Actions are dynamically provided based
 * on the current context and user permissions.
 *
 * **Common use cases:**
 * - Adding custom actions to resource kebab menus
 * - Contributing toolbar buttons to specific pages
 * - Providing context-sensitive operations in topology view
 * - Adding bulk actions to resource list pages
 *
 * **Context scoping:**
 * - `contextId` determines where actions appear in the UI
 * - Built-in contexts: 'resource', 'topology', 'helm', etc.
 * - Custom contexts can be defined by other extensions
 *
 * **Action lifecycle:**
 * - Hook is called whenever context changes
 * - Actions are filtered based on user permissions
 * - Actions can be conditionally shown/hidden
 *
 *
 * **Example console-extensions.json:**
 * ```json
 * [
 *   {
 *     "type": "console.action/provider",
 *     "properties": {
 *       "contextId": "resource",
 *       "provider": {"$codeRef": "resourceActionProvider"}
 *     }
 *   }
 * ]
 * ```
 *
 * **Example implementation:**
 * ```tsx
 * // resourceActionProvider.tsx
 * export const resourceActionProvider = (resource: K8sResourceCommon) => {
 *   return [
 *     {
 *       id: 'restart-deployment',
 *       label: 'Restart',
 *       cta: () => restartDeployment(resource.metadata.name),
 *       disabled: resource.kind !== 'Deployment'
 *     }
 *   ];
 * };
 * ```
 */
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

/**
 * ResourceActionProvider contributes a hook that returns list of actions for specific resource model.
 *
 * This extension provides a more targeted way to contribute actions that are specific to
 * particular Kubernetes resource types. It's more efficient than ActionProvider when
 * actions only apply to specific resource kinds.
 *
 * **Advantages over ActionProvider:**
 * - Actions only load for specified resource types
 * - Better performance for resource-specific actions
 * - Automatic filtering by resource model
 * - Type-safe access to resource-specific properties
 *
 * **Common use cases:**
 * - Pod-specific actions (restart, debug, logs)
 * - Deployment-specific actions (scale, rollout)
 * - Service-specific actions (expose, edit endpoints)
 * - Custom Resource actions for operators
 *
 *
 * **Example console-extensions.json:**
 * ```json
 * [
 *   {
 *     "type": "console.action/resource-provider",
 *     "properties": {
 *       "model": {"group": "", "version": "v1", "kind": "Pod"},
 *       "provider": {"$codeRef": "podActionProvider"}
 *     }
 *   }
 * ]
 * ```
 *
 * **Example implementation:**
 * ```tsx
 * // podActionProvider.tsx
 * export const podActionProvider = (pod: PodKind) => {
 *   const isRunning = pod.status?.phase === 'Running';
 *
 *   return [
 *     {
 *       id: 'view-logs',
 *       label: 'View Logs',
 *       cta: () => navigateToLogs(pod)
 *     },
 *     {
 *       id: 'debug-pod',
 *       label: 'Debug',
 *       cta: () => startDebugSession(pod),
 *       disabled: !isRunning
 *     }
 *   ];
 * };
 * ```
 */
export type ResourceActionProvider = ExtensionDeclaration<
  'console.action/resource-provider',
  {
    /** The model for which this provider provides actions for. */
    model: ExtensionK8sKindVersionModel;
    /** A react hook which returns actions for the given resource model */
    provider: CodeRef<ExtensionHook<Action[]>>;
  }
>;

/**
 * ActionGroup contributes an action group that can also be a submenu.
 *
 * Action groups provide logical organization for related actions, improving UX
 * by grouping similar operations together. Groups can be rendered as sections
 * with separators or as nested submenus.
 *
 * **Organization benefits:**
 * - Groups related actions together visually
 * - Reduces clutter in action menus
 * - Provides hierarchical organization for complex actions
 * - Supports custom ordering and positioning
 *
 * **Rendering modes:**
 * - Section: Actions grouped with separator lines
 * - Submenu: Actions nested under a parent menu item
 *
 * **Positioning control:**
 * - `insertBefore`/`insertAfter` control group ordering
 * - Supports positioning relative to other groups
 * - First match in array is used for positioning
 *
 *
 * **Example console-extensions.json:**
 * ```json
 * [
 *   {
 *     "type": "console.action/group",
 *     "properties": {
 *       "id": "advanced-operations",
 *       "label": "Advanced",
 *       "submenu": true,
 *       "insertAfter": "basic-operations"
 *     }
 *   }
 * ]
 * ```
 *
 * **Example usage in action provider:**
 * ```tsx
 * export const advancedActionProvider = () => [
 *   {
 *     id: 'export-config',
 *     label: 'Export Configuration',
 *     groupId: 'advanced-operations',
 *     cta: exportConfiguration
 *   }
 * ];
 * ```
 */
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

/**
 * ActionFilter can be used to filter an action.
 *
 * Action filters provide fine-grained control over when actions should be visible
 * or available. They allow for dynamic action visibility based on context,
 * resource state, user permissions, or other runtime conditions.
 *
 * **Common filtering scenarios:**
 * - Hide actions based on resource state (e.g., no restart for stopped pods)
 * - Filter actions based on user permissions or cluster features
 * - Remove conflicting actions (e.g., hide manual scale for HPA-controlled resources)
 * - Context-sensitive action availability
 *
 * **Filter execution:**
 * - Filters run after actions are provided by ActionProviders
 * - Multiple filters can apply to the same context
 * - Filters can examine both the context and the specific action
 * - Return false to hide the action, true to show it
 *
 * **Performance considerations:**
 * - Filters run frequently as context changes
 * - Keep filter logic lightweight and fast
 * - Avoid expensive API calls in filter functions
 *
 *
 * **Example console-extensions.json:**
 * ```json
 * [
 *   {
 *     "type": "console.action/filter",
 *     "properties": {
 *       "contextId": "resource",
 *       "filter": {"$codeRef": "hideScaleActionFilter"}
 *     }
 *   }
 * ]
 * ```
 *
 * **Example implementation:**
 * ```tsx
 * // hideScaleActionFilter.tsx
 * export const hideScaleActionFilter = (
 *   resource: K8sResourceCommon,
 *   action: Action
 * ) => {
 *   // Hide scale actions if resource has HPA
 *   if (action.id === 'scale-deployment' && resource.kind === 'Deployment') {
 *     const hasHPA = resource.metadata?.annotations?.['hpa.autoscaling.k8s.io/enabled'];
 *     return !hasHPA;  // Hide action if HPA is enabled
 *   }
 *
 *   return true;  // Show other actions normally
 * };
 * ```
 */
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

export type GroupedMenuOption = ActionGroup['properties'] & {
  children?: MenuOption[];
};

export type MenuOption = Action | GroupedMenuOption;

export type ActionService = {
  actions: Action[];
  options: MenuOption[];
  loaded: boolean;
  error: any;
};

export enum MenuOptionType {
  GROUP_MENU,
  SUB_MENU,
  ATOMIC_MENU,
}

export type ActionServiceProviderProps = {
  context: ActionContext;
  children: (service: ActionService) => React.ReactNode;
};
