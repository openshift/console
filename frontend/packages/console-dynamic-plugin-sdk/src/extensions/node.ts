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

export type InventoryItemComponentProps = {
  obj: NodeKind;
};

/**
 * Use this extension to add inventory items to the Node inventory card.
 *
 * Example implementation:
 * ```tsx
 * const MyInventoryItem: React.FC<InventoryItemComponentProps> = ({ obj }) => {
 *   const count = calculateCount(obj);
 *   return <InventoryItem title="My Resource" count={count} />;
 * };
 * ```
 */
export type NodeInventoryExtensionItem = Extension<
  'console.node/inventory-item',
  {
    /**
     * The inventory item that displays in the node inventory card. The UI uses the priority value to order this item relative to other inventory items. For example, Images: 70.
     *
     * Note: Inventory items are shown in priority order from highest to lowest. Current node inventory item priorities are:
     *   Pods: 90
     *   Images: 70
     */
    priority: number;
    /** The React component that renders in the inventory card. */
    component: CodeRef<ComponentType<InventoryItemComponentProps>>;
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
 * - The `tabId` must be unique across all tabs for the parent tab. If multiple plugins register the same `tabId`, the UI displays only the first one loaded.
 * - The `name` property supports i18n translation keys in the format `%namespace~key%`.
 * - The UI sorts tabs by priority in descending order with highest priority first. If two tabs have the same priority, the UI sorts them alphabetically by name.
 * - The component receives the Node resource as the `obj` prop using `SubPageComponentProps`.
 */
export type NodeSubNavTab = Extension<
  'console.node/sub-nav-tab',
  {
    /** Which detail tab to add the sub-tab to. Valid values: configuration, health, workload. */
    parentTab: 'configuration' | 'health' | 'workload';
    /**
     * The page that displays as a sub-tab. It requires the tab name and its corresponding priority.
     *
     * Notes:
     * The UI displays tabs in priority order from highest to lowest. Default built-in tab priorities include:
     * - **configuration**:
     *   - storage/70
     *   - machine/50
     *   - high-availability/30
     * - **health**:
     *   - performance/70
     *   - logs/30
     * - **workload**:
     *   - pods/30
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

export const isNodeInventoryItem = (e: Extension): e is NodeInventoryExtensionItem =>
  e.type === 'console.node/inventory-item';
