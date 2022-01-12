import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceSummary } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OverviewItem, PodRing } from '@console/shared';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import DomainMappingOverviewList from '../../components/overview/domain-mapping/DomainMappingOverviewList';
import { PubSubResourceOverviewList } from '../../components/overview/EventPubSubResources';
import EventPubSubSubscribers from '../../components/overview/EventPubSubSubscribers';
import ServerlessFunctionType from '../../components/overview/ServerlessFunctionType';
import { RevisionModel } from '../../models';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import { isServerlessFunction } from '../knative-topology-utils';
import { Subscriber } from '../topology-types';

type KnativeOverviewDetailsProps = {
  item?: OverviewItem;
};

type OverviewListProps = {
  items: K8sResourceKind[];
};

type SubscriptionsOverviewList = {
  subscriptions: Subscriber[];
};

export const EventSourcesOverviewList: React.FC<OverviewListProps> = ({ items }) => {
  const { t } = useTranslation();
  return items?.length > 0 ? (
    <TopologySideBarTabSection>
      <PubSubResourceOverviewList items={items} title={t('knative-plugin~Event Sources')} />
    </TopologySideBarTabSection>
  ) : null;
};

export const SubscriptionsOverviewList: React.FC<SubscriptionsOverviewList> = ({
  subscriptions,
}) => {
  const { t } = useTranslation();
  return subscriptions?.length > 0 ? (
    <TopologySideBarTabSection>
      <EventPubSubSubscribers
        subscribers={subscriptions}
        title={t('knative-plugin~Subscriptions')}
      />
    </TopologySideBarTabSection>
  ) : null;
};

export const TriggersOverviewList: React.FC<SubscriptionsOverviewList> = ({ subscriptions }) => {
  const { t } = useTranslation();
  return subscriptions?.length > 0 ? (
    <TopologySideBarTabSection>
      <EventPubSubSubscribers subscribers={subscriptions} title={t('knative-plugin~Triggers')} />
    </TopologySideBarTabSection>
  ) : null;
};

export const DomainMappingsOverviewList: React.FC<OverviewListProps> = ({ items }) => {
  const { t } = useTranslation();
  return items?.length > 0 ? (
    <TopologySideBarTabSection>
      <DomainMappingOverviewList
        domainMappings={items}
        title={t('knative-plugin~Domain mappings')}
      />
    </TopologySideBarTabSection>
  ) : null;
};

export const KnativeOverviewRevisionPodsRing: React.FC<KnativeOverviewDetailsProps> = ({
  item,
}) => {
  const { obj } = item;
  const { pods } = usePodsForRevisions(obj.metadata.uid, obj.metadata.namespace);
  return (
    <div className="resource-overview__pod-counts">
      <PodRing
        pods={pods?.[0]?.pods || []}
        obj={obj}
        rc={pods?.[0]?.obj}
        resourceKind={RevisionModel}
        path="/spec/replicas"
      />
    </div>
  );
};

export const KnativeOverviewDetails: React.FC<KnativeOverviewDetailsProps> = ({ item }) => {
  const { obj } = item;
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {obj.kind === RevisionModel.kind ? <KnativeOverviewRevisionPodsRing item={item} /> : null}
      <div className="resource-overview__summary">
        <ResourceSummary resource={obj} />
      </div>
      {isServerlessFunction(obj) && (
        <div className="resource-overview__details">
          <ServerlessFunctionType />
        </div>
      )}
    </div>
  );
};

export const KnativeEventSinkPodRing: React.FC<KnativeOverviewDetailsProps> = ({ item }) => {
  const { revisions, obj } = item as { obj: K8sResourceKind; revisions: K8sResourceKind[] };
  const { pods } = usePodsForRevisions(
    revisions?.map((r) => r.metadata.uid),
    obj.metadata.namespace,
  );
  return (
    <div className="resource-overview__pod-counts">
      <PodRing
        pods={pods?.[0]?.pods || []}
        obj={obj}
        rc={pods?.[0]?.obj}
        resourceKind={RevisionModel}
        enableScaling={false}
        path="/spec/replicas"
      />
    </div>
  );
};

export const KnativeEventSinkOverviewDetails: React.FC<KnativeOverviewDetailsProps> = ({
  item,
}) => {
  const { obj } = item;
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <KnativeEventSinkPodRing item={item} />
      <div className="resource-overview__summary">
        <ResourceSummary resource={obj} />
      </div>
    </div>
  );
};
