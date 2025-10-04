import { WatchK8sResources } from '@console/dynamic-plugin-sdk';
import { FirehoseResource } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  StatusGroupMapper,
  ExpandedComponentProps,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { Extension, LazyLoader } from './base';

namespace ExtensionProperties {
  export interface DashboardsOverviewInventoryItem {
    /** The model for `resource` which will be fetched. The model is used for getting model's label or abbr. */
    model: K8sKind;

    /** Function which will map various statuses to groups. */
    mapper?: () => Promise<StatusGroupMapper>;

    /** Additional resources which will be fetched and passed to `mapper` function. */
    additionalResources?: WatchK8sResources<any>;

    /** Loader for the component which will be used when item is expanded. */
    expandedComponent?: LazyLoader<ExpandedComponentProps>;
  }

  export interface DashboardsInventoryItemGroup {
    /** The ID of status group. */
    id: string;

    /** React component representing status group icon. */
    icon: React.ReactElement;
  }

  export interface DashboardsOverviewUtilizationItem {
    /** The utilization item to be replaced */
    id: string;

    /** The Prometheus utilization query */
    query: string;

    /** The Prometheus total query */
    totalQuery: string;
  }

  export interface DashboardsOverviewResourceActivity {
    /** Resource to watch */
    k8sResource: FirehoseResource & { isList: true };

    /**
     * Function which will determine if given resource represents the action.
     * If the function is not defined, every resource represents activity.
     */
    isActivity?: (resource: K8sResourceKind) => boolean;

    /** Timestamp for given action, which will be used for ordering */
    getTimestamp?: (resource: K8sResourceKind) => Date;

    /** Loader for corresponding action component */
    loader: LazyLoader<K8sActivityProps>;
  }
}

export interface DashboardsOverviewInventoryItem
  extends Extension<ExtensionProperties.DashboardsOverviewInventoryItem> {
  type: 'Dashboards/Overview/Inventory/Item';
}

export const isDashboardsOverviewInventoryItem = (
  e: Extension,
): e is DashboardsOverviewInventoryItem => e.type === 'Dashboards/Overview/Inventory/Item';

export interface DashboardsInventoryItemGroup
  extends Extension<ExtensionProperties.DashboardsInventoryItemGroup> {
  type: 'Dashboards/Inventory/Item/Group';
}

export const isDashboardsInventoryItemGroup = (e: Extension): e is DashboardsInventoryItemGroup =>
  e.type === 'Dashboards/Inventory/Item/Group';

export interface DashboardsOverviewResourceActivity
  extends Extension<ExtensionProperties.DashboardsOverviewResourceActivity> {
  type: 'Dashboards/Overview/Activity/Resource';
}

export const isDashboardsOverviewResourceActivity = (
  e: Extension,
): e is DashboardsOverviewResourceActivity => e.type === 'Dashboards/Overview/Activity/Resource';

export interface DashboardsOverviewInventoryItemReplacement
  extends Extension<ExtensionProperties.DashboardsOverviewInventoryItem> {
  type: 'Dashboards/Overview/Inventory/Item/Replacement';
}

export const isDashboardsOverviewInventoryItemReplacement = (
  e: Extension,
): e is DashboardsOverviewInventoryItemReplacement =>
  e.type === 'Dashboards/Overview/Inventory/Item/Replacement';

export type K8sActivityProps = {
  resource: K8sResourceKind;
};
