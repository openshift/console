import * as React from 'react';
import { OverviewDetailItemProps } from '@openshift-console/plugin-shared/src';
import { CodeRef, Extension, ExtensionDeclaration } from '../types';
import { Humanize, TopConsumerPopoverProps, QueryWithDescription } from './console-types';

/** Adds a new inventory item into cluster overview page. */
export type ClusterOverviewInventoryItem = ExtensionDeclaration<
  'console.cluster-overview/inventory-item',
  {
    /** The component to be rendered. */
    component: CodeRef<React.ComponentType>;
  }
>;

export type GetQuery = (nodeType: string[]) => string;
export type GetMultilineQueries = (nodeType: string[]) => QueryWithDescription[];

/** Adds a new cluster overview utilization item. */
export type ClusterOverviewUtilizationItem = ExtensionDeclaration<
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
    TopConsumerPopover?: CodeRef<React.ComponentType<TopConsumerPopoverProps>>;
  }
>;

/** Adds a new cluster overview multiline utilization item. */
export type ClusterOverviewMultilineUtilizationItem = ExtensionDeclaration<
  'console.cluster-overview/multiline-utilization-item',
  {
    /** The title of the utilization item. */
    title: string;
    /** Prometheus utilization query. */
    getUtilizationQueries: CodeRef<GetMultilineQueries>;
    /** Convert prometheus data to human readable form. */
    humanize: CodeRef<Humanize>;
    /** Shows Top consumer popover instead of plain value */
    TopConsumerPopovers?: CodeRef<React.ComponentType<TopConsumerPopoverProps>[]>;
  }
>;

/**
 * @deprecated use CustomOverviewDetailItem type instead
 */
export type OverviewDetailItem = ExtensionDeclaration<
  'console.dashboards/overview/detail/item',
  {
    /** The value, based on the DetailItem component */
    component: CodeRef<React.ComponentType>;
  }
>;

/** Adds an item to the Details card of Overview Dashboard */
export type CustomOverviewDetailItem = ExtensionDeclaration<
  'console.dashboards/custom/overview/detail/item',
  Omit<OverviewDetailItemProps, 'children' | 'isLoading' | 'error'> & {
    /** The value, rendered by the OverviewDetailItem component */
    component: CodeRef<React.ComponentType>;
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

export const isOverviewDetailItem = (e: Extension): e is OverviewDetailItem =>
  e.type === 'console.dashboards/overview/detail/item';

export const isCustomOverviewDetailItem = (e: Extension): e is CustomOverviewDetailItem =>
  e.type === 'console.dashboards/custom/overview/detail/item';
