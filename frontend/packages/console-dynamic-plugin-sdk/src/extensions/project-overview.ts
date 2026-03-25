import type { ComponentType } from 'react';
import type { Extension, CodeRef } from '../types';
import type { Humanize, TopConsumerPopoverProps } from './console-types';

/** Adds a new inventory item into project overview page. */
export type ProjectOverviewInventoryItem = Extension<
  'console.project-overview/inventory-item',
  {
    /** The component to be rendered. */
    component: CodeRef<ComponentType<{ projectName: string }>>;
  }
>;

export type GetProjectQuery = (projectName: string) => string;

/** Adds a new project overview utilization item. */
export type ProjectOverviewUtilizationItem = Extension<
  'console.project-overview/utilization-item',
  {
    /** The title of the utilization item. */
    title: string;
    /** Prometheus utilization query. */
    getUtilizationQuery: CodeRef<GetProjectQuery>;
    /** Convert prometheus data to human readable form. */
    humanize: CodeRef<Humanize>;
    /** Prometheus total query. */
    getTotalQuery?: CodeRef<GetProjectQuery>;
    /** Prometheus request query. */
    getRequestQuery?: CodeRef<GetProjectQuery>;
    /** Prometheus limit query. */
    getLimitQuery?: CodeRef<GetProjectQuery>;
    /** Shows Top consumer popover instead of plain value */
    TopConsumerPopover?: CodeRef<ComponentType<TopConsumerPopoverProps>>;
  }
>;

// Type guards

export const isProjectOverviewInventoryItem = (e: Extension): e is ProjectOverviewInventoryItem =>
  e.type === 'console.project-overview/inventory-item';

export const isProjectOverviewUtilizationItem = (
  e: Extension,
): e is ProjectOverviewUtilizationItem => e.type === 'console.project-overview/utilization-item';
