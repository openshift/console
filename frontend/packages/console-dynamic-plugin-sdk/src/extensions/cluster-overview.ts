import type { ComponentType } from 'react';
import type { Extension, CodeRef } from '../types';
import type { Humanize, TopConsumerPopoverProps, QueryWithDescription } from './console-types';

/** Adds a new inventory item into cluster overview page. */
export type ClusterOverviewInventoryItem = Extension<
  'console.cluster-overview/inventory-item',
  {
    /** The component to be rendered. */
    component: CodeRef<ComponentType>;
  }
>;

export type GetQuery = (nodeType: string[]) => string;
export type GetMultilineQueries = (nodeType: string[]) => QueryWithDescription[];

/** Adds a new cluster overview utilization item. */
export type ClusterOverviewUtilizationItem = Extension<
  'console.cluster-overview/utilization-item',
  {
    /** The title of the utilization item. */
    title: string;
    /** Prometheus utilization query. */
    getUtilizationQuery: CodeRef<GetQuery>;
    /** Convert prometheus data to human readable form. */
    humanize: CodeRef<Humanize>;
    /** Prometheus total query. */
    getTotalQuery?: CodeRef<GetQuery>;
    /** Prometheus request query. */
    getRequestQuery?: CodeRef<GetQuery>;
    /** Prometheus limit query. */
    getLimitQuery?: CodeRef<GetQuery>;
    /** Shows Top consumer popover instead of plain value */
    TopConsumerPopover?: CodeRef<ComponentType<TopConsumerPopoverProps>>;
  }
>;

/** Adds a new cluster overview multiline utilization item. */
export type ClusterOverviewMultilineUtilizationItem = Extension<
  'console.cluster-overview/multiline-utilization-item',
  {
    /** The title of the utilization item. */
    title: string;
    /** Prometheus utilization query. */
    getUtilizationQueries: CodeRef<GetMultilineQueries>;
    /** Convert prometheus data to human readable form. */
    humanize: CodeRef<Humanize>;
    /** Shows Top consumer popover instead of plain value */
    TopConsumerPopovers?: CodeRef<ComponentType<TopConsumerPopoverProps>[]>;
  }
>;

/** Adds an item to the Details card of Overview Dashboard */
export type CustomOverviewDetailItem = Extension<
  'console.dashboards/custom/overview/detail/item',
  {
    /** Details card title */
    title: string;
    /** Optional class name for the value */
    valueClassName?: string;
    /** The value, rendered by the OverviewDetailItem component */
    component: CodeRef<ComponentType>;
    /** Function returning the loading state of the component */
    isLoading?: CodeRef<() => boolean>;
    /** Function returning errors to be displayed by the component */
    error?: CodeRef<() => string>;
  }
>;

// Type guards

export const isClusterOverviewInventoryItem = (e: Extension): e is ClusterOverviewInventoryItem =>
  e.type === 'console.cluster-overview/inventory-item';

export const isClusterOverviewUtilizationItem = (
  e: Extension,
): e is ClusterOverviewUtilizationItem => e.type === 'console.cluster-overview/utilization-item';

export const isClusterOverviewMultilineUtilizationItem = (
  e: Extension,
): e is ClusterOverviewMultilineUtilizationItem =>
  e.type === 'console.cluster-overview/multiline-utilization-item';

export const isCustomOverviewDetailItem = (e: Extension): e is CustomOverviewDetailItem =>
  e.type === 'console.dashboards/custom/overview/detail/item';
