import type { ReactNode } from 'react';
import type { ExtensionHook, ExtensionK8sKindVersionModel } from '../api/common-types';
import type { ActionContext } from '../api/internal-types';
import type { Extension, CodeRef } from '../types';
import type { AccessReviewResourceAttributes, K8sResourceCommon } from './console-types';

/** ActionProvider contributes a hook that returns list of actions for specific context */
export type ActionProvider = Extension<
  'console.action/provider',
  {
    /** The context ID helps to narrow the scope of contributed actions to a particular area of
     * the application.
     *
     * A resource detail page or list row menu uses the resource's group, version and kind
     * reference as its context ID, formatted `group~version~Kind`, with `core` standing in for
     * the core group. For example `apps~v1~Deployment` or `core~v1~Pod`. Registering against
     * one of these adds actions to that resource's menu alongside the actions Console itself
     * contributes.
     *
     * Prefer `console.action/resource-provider` for a resource, which takes the model instead of
     * a reference string. Console's default list and details pages, which serve any resource
     * without a dedicated page, build their menu from extensions only once a
     * `console.action/resource-provider` is registered for the model; until then they render a
     * built-in menu that no `console.action/provider` or `console.action/filter` can reach.
     *
     * The remaining context IDs name an area of the UI. Those currently in use are:
     * - `topology-actions`
     * - `topology-context-actions`
     * - `helm-actions`
     * - `operator-actions`
     * - `operand-actions`
     * - `event-source-actions`
     */
    contextId: string;
    /** A react hook which returns actions for the given scope.
     * The scope is whatever the menu passed for this context ID, which for a resource menu is
     * the K8s resource object.
     * */
    provider: CodeRef<ExtensionHook<Action[]>>;
  }
>;

/** ResourceActionProvider contributes a hook that returns list of actions for specific resource model */
export type ResourceActionProvider = Extension<
  'console.action/resource-provider',
  {
    /** The model for which this provider provides actions for. */
    model: ExtensionK8sKindVersionModel;
    /** A react hook which returns actions for the given resource model */
    provider: CodeRef<ExtensionHook<Action[]>>;
    /** (optional) Hook returning actions for a filtered selection of resources of this model. Only return actions that support bulk use, and check applicability and access for the full selection. It is not called for an empty or mixed-model selection. */
    bulkProvider?: CodeRef<BulkResourceActionHook>;
  }
>;

/** Selection passed to a resource bulk action provider. IDs passed to `deselect` come from `getResourceId`. */
export type BulkResourceActionContext = {
  /** Selected resources matching the table's current filters. */
  matchingSelectedResources: K8sResourceCommon[];
  /** Returns the ID used by the table to track a resource's selection. */
  getResourceId: (resource: K8sResourceCommon) => string;
  /** Clears every selection, including resources hidden by the current filters. */
  clearSelection: () => void;
  /** Deselects resources by their table selection IDs, for example after partial success. */
  deselect: (resourceIds: string[]) => void;
};

/** Hook supplying the bulk-capable actions for a resource selection. */
export type BulkResourceActionHook = ExtensionHook<Action[], BulkResourceActionContext>;

/** ActionGroup contributes an action group that can also be a submenu */
export type ActionGroup = Extension<
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
export type ActionFilter = Extension<
  'console.action/filter',
  {
    /** The context ID of the menu whose actions should be filtered, using the same values as
     * `console.action/provider`. A filter registered against a resource context ID such as
     * `apps~v1~Deployment` sees every action in that menu, including the ones Console itself
     * contributes, so a plugin can hide a built-in action by returning false for its `id`.
     *
     * When more than one filter is registered for a context ID, an action is kept if any of
     * them returns true.
     */
    contextId: string;
    /** A function which will filter actions based on some conditions.
     * scope: The scope in which actions should be provided for.
     * In a `ConsoleDataView` bulk menu, filters matching the resource model are evaluated
     * for each matching selected resource. Every resource must pass at least one matching
     * filter for the action to remain visible. Scope is one resource, not the bulk context.
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

export const isActionProvider = (e: Extension): e is ActionProvider =>
  e.type === 'console.action/provider';

export const isResourceActionProvider = (e: Extension): e is ResourceActionProvider =>
  e.type === 'console.action/resource-provider';

export const isActionGroup = (e: Extension): e is ActionGroup => e.type === 'console.action/group';

export const isActionFilter = (e: Extension): e is ActionFilter =>
  e.type === 'console.action/filter';

// Support types

export type Action = {
  /** A unique identifier for this action. */
  id: string;
  /** The label to display in the UI. */
  label: ReactNode;
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
  icon?: string | ReactNode;
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
  children: (service: ActionService) => ReactNode;
};
