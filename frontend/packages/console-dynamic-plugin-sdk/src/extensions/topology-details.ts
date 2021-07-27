import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { BuildConfigData } from '../api/topology-types';
import { CodeRef, ExtensionDeclaration } from '../types';
import { K8sResourceCommon } from './console-types';

/** DetailsTab contributes a tab for the topology details panel. */
export type DetailsTab = ExtensionDeclaration<
  'console.topology/details/tab',
  {
    /** A unique identifier for this details tab. */
    id: string;
    /** The tab label to display in the UI. */
    label: string;
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

/** DetailsTabSection contributes a section for a specific tab in topology details panel. */
export type DetailsTabSection = ExtensionDeclaration<
  'console.topology/details/tab-section',
  {
    /** A unique identifier for this details tab section. */
    id: string;
    /** The parent tab ID that this section should contribute to. */
    tab: string;
    /** Returns a section for the graph element or undefined if not provided.
     * SDK component: <Section title={<optional>}>... padded area </Section>
     * */
    section: CodeRef<(element: GraphElement) => React.Component | undefined>;
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

/** DetailsResourceLink contributes a link for specific topology context or graph element. */
export type DetailsResourceLink = ExtensionDeclaration<
  'console.topology/details/resource-link',
  {
    /** A higher priority factory will get the first chance to create the link. */
    priority?: number;
    /** Return the resource link if provided, otherwise undefined.
     * Use ResourceIcon and ResourceLink for styles.
     * */
    link: CodeRef<(element: GraphElement) => React.Component | undefined>;
  }
>;

/** DetailsResourceAlert contributes an alert for specific topology context or graph element. */
export type DetailsResourceAlert = ExtensionDeclaration<
  'console.topology/details/resource-alert',
  {
    /** The ID of this alert. Used to save state if the alert shouldn't be shown after dismissed. */
    id: string;
    /** Hook to return the contents of the Alert. */
    contentProvider: CodeRef<(element: GraphElement) => DetailsResourceAlertContent | null>;
  }
>;

/** PodAdapter contributes an adapter to adapt element to data that can be used by Pod component */
export type PodAdapter = ExtensionDeclaration<
  'console.topology/adapter/pod',
  {
    adapt: CodeRef<(element: GraphElement) => AdapterDataType<PodsAdapterDataType> | undefined>;
  }
>;

/** BuildAdapter contributes an adapter to adapt element to data that can be used by Build component */
export type BuildAdapter = ExtensionDeclaration<
  'console.topology/adapter/build',
  {
    adapt: CodeRef<(element: GraphElement) => AdapterDataType<BuildConfigData> | undefined>;
  }
>;

/** NetworkAdpater contributes an adapter to adapt element to data that can be used by Networking component */
export type NetworkAdapter = ExtensionDeclaration<
  'console.topology/adapter/network',
  {
    adapt: CodeRef<(element: GraphElement) => AdapterDataType | undefined>;
  }
>;

export type SupportedTopologyDetailsExtensions =
  | DetailsTab
  | DetailsTabSection
  | DetailsResourceLink
  | DetailsResourceAlert
  | PodAdapter
  | BuildAdapter
  | NetworkAdapter;

// Type guards

export const isDetailsTab = (e: Extension): e is DetailsTab => {
  return e.type === 'console.topology/details/tab';
};

export const isDetailsTabSection = (e: Extension): e is DetailsTabSection => {
  return e.type === 'console.topology/details/tab-section';
};

export const isDetailsResourceLink = (e: Extension): e is DetailsResourceLink => {
  return e.type === 'console.topology/details/resource-link';
};

export const isDetailsResourceAlert = (e: Extension): e is DetailsResourceAlert => {
  return e.type === 'console.topology/details/resource-alert';
};

export const isPodAdapter = (e: Extension): e is PodAdapter => {
  return e.type === 'console.topology/adapter/pod';
};

export const isBuildAdapter = (e: Extension): e is BuildAdapter => {
  return e.type === 'console.topology/adapter/build';
};

export const isNetworkAdapter = (e: Extension): e is NetworkAdapter => {
  return e.type === 'console.topology/adapter/network';
};

export type DetailsResourceAlertContent = {
  /** The title of the alert */
  title: string;
  /** Whether to show a dismiss button. false by default.
   * State will be store in user settings, once dismissed alert won't show up again untill user settings state resets
   */
  dismissible?: boolean;
  content: React.Component | undefined;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  actionLinks?: React.ReactNode;
};

export type AdapterDataType<D = {}> = {
  resource: K8sResourceCommon;
  provider?: (resource: K8sResourceCommon) => D;
};

export type PodsAdapterDataType<E = K8sResourceCommon> = {
  pods: E[];
  loaded: boolean;
  loadError: string;
  buildConfigsData?: BuildConfigData;
};
