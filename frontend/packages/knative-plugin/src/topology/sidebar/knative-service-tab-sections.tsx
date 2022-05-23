import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { AdapterDataType } from '@console/dynamic-plugin-sdk/src';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { BuildConfigData, useBuildConfigsWatcher } from '@console/shared';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import RevisionsOverviewList from '../../components/overview/RevisionsOverviewList';
import { getSubscriberByType } from '../knative-topology-utils';
import { NodeType } from '../topology-types';
import {
  DomainMappingsOverviewList,
  SubscriptionsOverviewList,
  TriggersOverviewList,
} from './KnativeOverviewSections';

export const useKnativeSidepanelRevisionSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== NodeType.KnService) {
    return [undefined, true, undefined];
  }
  const knObj = element.getData().resources;
  const resource = getResource(element);
  const section = (
    <TopologySideBarTabSection>
      <RevisionsOverviewList revisions={knObj.revisions} service={resource} />
    </TopologySideBarTabSection>
  );
  return [section, true, undefined];
};

export const getKnativeSidepanelBuildAdapterSection = (
  element: GraphElement,
): AdapterDataType<BuildConfigData> | undefined => {
  if (element.getType() !== NodeType.KnService) return undefined;
  const resource = getResource(element);
  return { resource, provider: useBuildConfigsWatcher };
};

export const useKnativeSidepanelSubscriptionsSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== NodeType.KnService) {
    return [undefined, true, undefined];
  }
  const knObj = element.getData().resources;
  const { subscribers } = knObj;
  const [channels] = getSubscriberByType(subscribers);
  const section = <SubscriptionsOverviewList subscriptions={channels} />;
  return [section, true, undefined];
};

export const useKnativeSidepanelTriggersSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== NodeType.KnService) {
    return [undefined, true, undefined];
  }
  const knObj = element.getData().resources;
  const { subscribers } = knObj;
  const [, brokers] = getSubscriberByType(subscribers);
  const section = <TriggersOverviewList subscriptions={brokers} />;
  return [section, true, undefined];
};

export const useKnativeSidepanelDomainMappingsSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== NodeType.KnService) {
    return [undefined, true, undefined];
  }
  const knObj = element.getData().resources;
  const section = <DomainMappingsOverviewList items={knObj.domainMappings} />;
  return [section, true, undefined];
};
