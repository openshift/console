import type { ComponentType } from 'react';
import type { Extension, CodeRef } from '../types';
import type { K8sResourceCommon } from './console-types';

export type SubPageComponentProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  obj: R;
};

/** This extension can be used to add a tab on the sub-tabs for a Nodes details tab. */
export type NodeSubNavTab = Extension<
  'console.tab/nodeSubNavTab',
  {
    /** Which detail tab to add the sub-tab to. */
    parentTab: 'configuration' | 'health' | 'workloads';
    /** The page to be show in node sub tabs. It takes tab name as name and priority of the tab.
     * Note: Tabs are shown in priority order from highest to lowest. Current node tab priorities are:
     *  configuration:
     *     Storage: 70
     *     Operating system: 50
     *     Machine: 40
     *     High availability: 30
     *   health:
     *     Performance: 70
     *     Logs: 30
     *   workloads:
     *     Pods: 30
     */
    page: {
      tabId: string;
      name: string;
      priority: number;
    };
    /** The component to be rendered when the route matches. */
    component: CodeRef<ComponentType<SubPageComponentProps>>;
  }
>;

export const isNodeSubNavTab = (e: Extension): e is NodeSubNavTab =>
  e.type === 'console.tab/nodeSubNavTab';
