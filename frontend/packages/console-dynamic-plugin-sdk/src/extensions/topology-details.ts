import * as React from 'react';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { GraphElement } from '@patternfly/react-topology';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';

namespace ExtensionProperties {
  export type DetailsTab = {
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
  };

  export type DetailsTabSection = {
    /** A unique identifier for this details tab section. */
    id: string;
    /** The parent tab ID that this section should contribute to. */
    tab: string;
    /** Returns a section for the graph element or undefined if not provided.
     * SDK component: <Section title={<optional>}>... padded area </Section>
     * */
    section: EncodedCodeRef;
    /** Insert this item before the item referenced here.
     * For arrays, the first one found in order is used.
     * */
    insertBefore?: string | string[];
    /** Insert this item after the item referenced here.
     * For arrays, the first one found in order is used.
     * insertBefore takes precedence.
     * */
    insertAfter?: string | string[];
  };

  export type DetailsResourceLink = {
    /** A higher priority factory will get the first chance to create the link. */
    priority?: number;
    /** Return the resource link if provided, otherwise undefined.
     * Use ResourceIcon and ResourceLink for styles.
     * */
    link: EncodedCodeRef;
  };

  export type DetailsResourceAlert = {
    /** The ID of this alert. Used to save state if the alert should be shown after dismissed. */
    id: string;
    /** The title of the alert */
    title: string;
    /** Hook to return the contents of the Alert. */
    contentProvider: EncodedCodeRef;
    /** Whether to show a dismiss button. false by default */
    dismissible?: boolean;
  };

  export type DetailsTabSectionCodeRefs = {
    section: CodeRef<(element: GraphElement) => React.Component | undefined>;
  };

  export type DetailsResourceLinkCodeRefs = {
    link: CodeRef<(element: GraphElement) => React.Component | undefined>;
  };

  export type DetailsResourceAlertCodeRefs = {
    contentProvider: CodeRef<(element: GraphElement) => DetailsResourceAlertContent>;
  };
}

export type DetailsTab = Extension<ExtensionProperties.DetailsTab> & {
  type: 'topology.details/tab';
};

export type DetailsTabSection = Extension<ExtensionProperties.DetailsTabSection> & {
  type: 'topology.details/tab-section';
};

export type DetailsResourceLink = Extension<ExtensionProperties.DetailsResourceLink> & {
  type: 'topology.details/resource-link';
};

export type DetailsResourceAlert = Extension<ExtensionProperties.DetailsResourceAlert> & {
  type: 'topology.details/resource-alert';
};

export type ResolvedDetailsTabSection = UpdateExtensionProperties<
  DetailsTabSection,
  ExtensionProperties.DetailsTabSectionCodeRefs
>;

export type ResolvedDetailsResourceLink = UpdateExtensionProperties<
  DetailsResourceLink,
  ExtensionProperties.DetailsResourceLinkCodeRefs
>;

export type ResolvedDetailsResourceAlert = UpdateExtensionProperties<
  DetailsResourceAlert,
  ExtensionProperties.DetailsResourceAlertCodeRefs
>;

export const isDetailsTab = (e: Extension): e is DetailsTab => {
  return e.type === 'topology.details/tab';
};

export const isDetailsTabSection = (e: Extension): e is ResolvedDetailsTabSection => {
  return e.type === 'topology.details/tab-section';
};

export const isDetailsResourceLink = (e: Extension): e is ResolvedDetailsResourceLink => {
  return e.type === 'topology.details/resource-link';
};

export const isDetailsResourceAlert = (e: Extension): e is ResolvedDetailsResourceAlert => {
  return e.type === 'topology.details/resource-alert';
};

export type DetailsResourceAlertContent = {
  content: React.Component | undefined;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  actionLinks?: React.ReactNode;
};
