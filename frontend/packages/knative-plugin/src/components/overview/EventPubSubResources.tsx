import * as React from 'react';
import * as _ from 'lodash';
import { OverviewItem } from '@console/shared';
import { referenceFor, K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { EventingSubscriptionModel, EventingTriggerModel, EventingBrokerModel } from '../../models';
import PubSubSubscribers from './EventPubSubSubscribers';
import EventTriggerFilterList from './EventTriggerFilterList';
import { FilterTableRowProps } from './FilterTable';
import { Subscriber } from '../../topology/topology-types';

type PubSubResourceOverviewListProps = {
  items: K8sResourceKind[];
  title: string;
};

type EventPubSubResourcesProps = {
  item: OverviewItem & {
    triggers?: K8sResourceKind[];
    eventSources?: K8sResourceKind[];
    eventingsubscription?: K8sResourceKind[];
    pods?: K8sResourceKind[];
    deployments?: K8sResourceKind[];
    brokers?: K8sResourceKind[];
    channels?: K8sResourceKind[];
    ksservices?: K8sResourceKind[];
    filters?: FilterTableRowProps;
    subscribers?: Subscriber[];
  };
};

export const PubSubResourceOverviewList: React.FC<PubSubResourceOverviewListProps> = ({
  items,
  title,
}) => (
  <>
    <SidebarSectionHeading text={title} />
    {items?.length > 0 ? (
      <ul className="list-group">
        {_.map(items, (itemData) => (
          <li className="list-group-item" key={itemData.metadata.uid}>
            <ResourceLink
              kind={referenceFor(itemData)}
              name={itemData.metadata?.name}
              namespace={itemData.metadata?.namespace}
            />
          </li>
        ))}
      </ul>
    ) : (
      <span className="text-muted">No {title} found for this resource.</span>
    )}
  </>
);

const EventPubSubResources: React.FC<EventPubSubResourcesProps> = ({ item }) => {
  const {
    obj,
    ksservices = [],
    eventSources = [],
    pods = [],
    deployments = [],
    brokers = [],
    channels = [],
    filters = [],
    subscribers = [],
  } = item;

  switch (obj.kind) {
    case EventingTriggerModel.kind:
      return (
        <>
          <PubSubResourceOverviewList items={eventSources} title="Event Sources" />
          <PubSubResourceOverviewList items={brokers} title="Broker" />
          <PubSubResourceOverviewList items={ksservices} title="Subscriber" />
          <EventTriggerFilterList filters={filters} />
        </>
      );
    case EventingSubscriptionModel.kind:
      return (
        <>
          <PubSubResourceOverviewList items={eventSources} title="Event Sources" />
          <PubSubResourceOverviewList items={channels} title="Channel" />
          <PubSubResourceOverviewList items={ksservices} title="Subscriber" />
        </>
      );
    case EventingBrokerModel.kind:
      return (
        <>
          <PubSubResourceOverviewList items={eventSources} title="Event Sources" />
          <PubSubSubscribers subscribers={subscribers} />
          <PubSubResourceOverviewList items={pods} title="Pods" />
          <PubSubResourceOverviewList items={deployments} title="Deployments" />
        </>
      );
    default:
      return (
        <>
          <PubSubResourceOverviewList items={eventSources} title="Event Sources" />
          <PubSubSubscribers subscribers={subscribers} />
        </>
      );
  }
};

export default EventPubSubResources;
