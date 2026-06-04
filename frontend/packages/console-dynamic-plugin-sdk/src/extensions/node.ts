import type { ComponentType } from 'react';
import type { Extension, CodeRef } from '../types';
import type {
  K8sResourceCommon,
  NodeKind,
  ResourcesObject,
  WatchK8sResources,
  WatchK8sResults,
} from './console-types';

export type IsNodeStatusActive<T extends ResourcesObject> = (
  node: NodeKind,
  resources: WatchK8sResults<T>,
) => boolean;

export type NodePopoverContentProps<T extends ResourcesObject> = {
  node: NodeKind;
  resources: WatchK8sResults<T>;
};

/** Use this extension to add additional states to a Node resource. */
export type NodeStatus<T extends ResourcesObject = ResourcesObject> = Extension<
  'console.node/status',
  {
    /** Returns `true` if the additional state is active. */
    isActive: CodeRef<IsNodeStatusActive<T>>;
    /** React component that will be rendered in status popover */
    PopoverContent: CodeRef<ComponentType<NodePopoverContentProps<T>>>;
    /** Title of the additional Node state */
    title: string;
    /** Resources required to determine the extra state. */
    resources?: WatchK8sResources<T>;
  }
>;

/**
 * Props passed to components rendered in Node detail sub-tabs.
 *
 * ```
 * const MyNodeTab: React.FC<SubPageComponentProps<NodeKind>> = ({ obj }) => {
 *   return <div>Custom tab for {obj.metadata.name}</div>;
 * };
 * ```
 */
export type SubPageComponentProps<R extends K8sResourceCommon = NodeKind> = {
  /** The Node resource object */
  obj: R;
};

/**
 * Use this extension to add custom sub-tabs to the Node details page.
 *
 * Notes:
 * - The `tabId` must be unique across all tabs for the parent tab. If multiple plugins register the same `tabId`, only the first one loaded displays.
 *   the same `tabId`, only the first one loaded will be displayed.
 * - The `name` property supports i18n translation keys in the format `%namespace~key%`.
 * - The UI sorts tabs by priority in descending order (highest priority first). If two tabs have the same priority, it sorts them alphabetically by name.
 * - The component receives the Node resource as the `obj` prop using `SubPageComponentProps`.
 */
export type NodeSubNavTab = Extension<
  'console.node/sub-nav-tab',
  {
    /** Which detail tab to add the sub-tab to. Only the 'configuration' tab supports adding sub-tabs at this time. */
    parentTab: 'configuration';
    /**
     * The page to be shown in node sub tabs. It takes tab name as name and priority of the tab.
     *
     * Notes:
     * The UI displays tabs in priority order from highest to lowest. Default built-in tab priorities include:
     * - **configuration:**
     *   - storage/70
     *   - machine/50
     */
    page: {
      /**
       * Unique identifier for this tab. Must be unique across all tabs for the parent tab.
       * If duplicate tabIds are registered, built-in tabs take precedence, then only the first loaded will be displayed.
       */
      tabId: string;
      /**
       * Display name for the tab. Supports i18n translation keys in the format `%namespace~key%`.
       */
      name: string;
      /**
       * Priority for tab ordering. Higher values appear first. If two tabs have the same priority,
       * they are sorted alphabetically by name.
       */
      priority: number;
    };
    /** The component that renders the sub-tab contents. It receives the Node resource as the obj prop. */
    component: CodeRef<ComponentType<SubPageComponentProps>>;
  }
>;

export const isNodeStatus = (e: Extension): e is NodeStatus => e.type === 'console.node/status';

export const isNodeSubNavTab = (e: Extension): e is NodeSubNavTab =>
  e.type === 'console.node/sub-nav-tab';
