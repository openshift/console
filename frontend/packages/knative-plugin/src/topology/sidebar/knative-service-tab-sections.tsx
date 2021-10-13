import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { AdapterDataType } from '@console/dynamic-plugin-sdk/src';
import { BuildConfigData, useBuildConfigsWatcher } from '@console/shared';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import RevisionsOverviewList from '../../components/overview/RevisionsOverviewList';
import { getSubscriberByType } from '../knative-topology-utils';
import { NodeType } from '../topology-types';
import {
  DomainMappingsOverviewList,
  EventSourcesOverviewList,
  SubscriptionsOverviewList,
  TriggersOverviewList,
} from './KnativeOverviewSections';

export const getKnativeSidepanelRevisionSection = (element: GraphElement) => {
  if (element.getType() !== NodeType.KnService) return undefined;
  const knObj = element.getData().resources;
  const resource = getResource(element);
  return (
    <TopologySideBarTabSection>
      <RevisionsOverviewList revisions={knObj.revisions} service={resource} />
    </TopologySideBarTabSection>
  );
};

export const getKnativeSidepanelBuildAdapterSection = (
  element: GraphElement,
): AdapterDataType<BuildConfigData> | undefined => {
  if (element.getType() !== NodeType.KnService) return undefined;
  const resource = getResource(element);
  return { resource, provider: useBuildConfigsWatcher };
};

export const getKnativeSidepanelEventSourcesSection = (element: GraphElement) => {
  if (element.getType() !== NodeType.KnService) return undefined;
  const knObj = element.getData().resources;
  return <EventSourcesOverviewList items={knObj.eventSources} />;
};

export const getKnativeSidepanelSubscriptionsSection = (element: GraphElement) => {
  if (element.getType() !== NodeType.KnService) return undefined;
  const knObj = element.getData().resources;
  const { subscribers } = knObj;
  const [channels] = getSubscriberByType(subscribers);
  return <SubscriptionsOverviewList subscriptions={channels} />;
};

export const getKnativeSidepanelTriggersSection = (element: GraphElement) => {
  if (element.getType() !== NodeType.KnService) return undefined;
  const knObj = element.getData().resources;
  const { subscribers } = knObj;
  const [, brokers] = getSubscriberByType(subscribers);
  return <TriggersOverviewList subscriptions={brokers} />;
};

export const getKnativeSidepanelDomainMappingsSection = (element: GraphElement) => {
  if (element.getType() !== NodeType.KnService) return undefined;
  const knObj = element.getData().resources;

  return <DomainMappingsOverviewList items={knObj.domainMappings} />;
};
