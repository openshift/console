import * as React from 'react';
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
