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

/** This extension can be used to add additional states to Node resource. */
export type NodeStatus<T extends ResourcesObject = ResourcesObject> = Extension<
  'console.node/status',
  {
    /** Returns true if the additional state is active */
    isActive: CodeRef<IsNodeStatusActive<T>>;
    /** React component that will be rendered in status popover */
    PopoverContent: CodeRef<ComponentType<NodePopoverContentProps<T>>>;
    /** Title of the additional Node state */
    title: string;
    /** Additional resources that are needed to determine the additional state */
    resources?: WatchK8sResources<T>;
  }
>;

/**
 * Props passed to components rendered in Node detail sub-tabs.
 *
 * const MyNodeTab: React.FC<SubPageComponentProps<NodeKind>> = ({ obj }) => {
 *   return <div>Custom tab for {obj.metadata.name}</div>;
 * };
 * ```
 */
export type SubPageComponentProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  /** The Node resource object */
  obj: R;
};

/**
 * This extension can be used to add a tab on the sub-tabs for a Nodes details tab.
 *
 * Notes:
 * - The `tabId` must be unique across all tabs for the parent tab. If multiple plugins register
 *   the same `tabId`, only the first one loaded will be displayed.
 * - The `name` property supports i18n translation keys in the format `%namespace~key%`.
 * - Tabs are sorted by priority in descending order (highest priority first). If two tabs have
 *   the same priority, they are sorted alphabetically by name.
 * - The component receives the Node resource as the `obj` prop via `SubPageComponentProps`.
 */
export type NodeSubNavTab = Extension<
  'console.node/sub-nav-tab',
  {
    /** Which detail tab to add the sub-tab to. Currently only 'configuration' is supported. */
    parentTab: 'configuration';
    /**
     * The page to be shown in node sub tabs. It takes tab name as name and priority of the tab.
     *
     * Notes:
     * Tabs are shown in priority order from highest to lowest. Current built-in node tab priorities are:
     * - **configuration:**
     *   - Storage: 70
     *   - Machine: 50
     *     High availability: 30
     *  health:
     *     Performance: 70
     *     Logs: 30
     *  workloads:
     *     Pods: 30
     */
    page: {
      /**
       * Unique identifier for this tab. Must be unique across all tabs for the parent tab.
       * If duplicate tabIds are registered, only the first loaded will be displayed.
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
    /** The component to be rendered for the sub tab contents. Receives the Node resource as the `obj` prop. */
    component: CodeRef<ComponentType<SubPageComponentProps>>;
  }
>;

export const isNodeStatus = (e: Extension): e is NodeStatus => e.type === 'console.node/status';

export const isNodeSubNavTab = (e: Extension): e is NodeSubNavTab =>
  e.type === 'console.node/sub-nav-tab';
